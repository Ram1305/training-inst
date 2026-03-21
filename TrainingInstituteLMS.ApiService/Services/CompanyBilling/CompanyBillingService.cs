using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Common;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Services.CompanyBilling
{
    public class CompanyBillingService : ICompanyBillingService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<CompanyBillingService> _logger;

        public CompanyBillingService(TrainingLMSDbContext context, ILogger<CompanyBillingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private static bool IsPermanentCompanyPortalLink(EnrollmentLink? link) =>
            link != null && link.CompanyId.HasValue && !link.CompanyOrderId.HasValue;

        /// <inheritdoc />
        public async Task<bool> RecordPortalEnrollmentTrainingCompletedAsync(Guid enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.EnrollmentLink)
                .Include(e => e.Course)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null)
                return false;

            if (!string.Equals(enrollment.EnrollmentType, "Company", StringComparison.OrdinalIgnoreCase))
                return false;

            if (!IsPermanentCompanyPortalLink(enrollment.EnrollmentLink))
                return false;

            var companyId = enrollment.EnrollmentLink!.CompanyId!.Value;

            if (await _context.CompanyBillingLines.AnyAsync(l => l.EnrollmentId == enrollmentId))
            {
                if (enrollment.Status != "Completed")
                {
                    enrollment.Status = "Completed";
                    enrollment.CompletedAt ??= DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                else if (!enrollment.CompletedAt.HasValue)
                {
                    enrollment.CompletedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return true;
            }

            var completedAt = DateTime.UtcNow;
            enrollment.Status = "Completed";
            enrollment.CompletedAt = completedAt;

            var amount = enrollment.Course?.Price ?? 0;
            var sydneyDate = AustraliaSydneyTime.UtcInstantToSydneyDateOnly(completedAt);
            var courseName = enrollment.Course?.CourseName;
            var studentName = enrollment.Student?.FullName;

            var statement = new CompanyBillingStatement
            {
                StatementId = Guid.NewGuid(),
                CompanyId = companyId,
                SydneyBillingDate = sydneyDate,
                Status = "Unpaid",
                TotalAmount = amount,
                CreatedAt = DateTime.UtcNow
            };
            _context.CompanyBillingStatements.Add(statement);

            var line = new CompanyBillingLine
            {
                LineId = Guid.NewGuid(),
                StatementId = statement.StatementId,
                EnrollmentId = enrollmentId,
                Amount = amount,
                CourseNameSnapshot = courseName,
                StudentNameSnapshot = studentName
            };
            _context.CompanyBillingLines.Add(line);

            await _context.SaveChangesAsync();
            _logger.LogInformation(
                "Company portal billing: created Unpaid statement {StatementId} for enrollment {EnrollmentId}",
                statement.StatementId,
                enrollmentId);
            return true;
        }

        public async Task<CompanyBillingStatementListResponseDto> GetAdminStatementsAsync(
            int page,
            int pageSize,
            string? status,
            string? search,
            Guid? companyId)
        {
            var query = _context.CompanyBillingStatements
                .AsNoTracking()
                .Include(s => s.Company)
                .ThenInclude(c => c.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.Status == status.Trim());

            if (companyId.HasValue)
                query = query.Where(s => s.CompanyId == companyId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Company.CompanyName.ToLower().Contains(term) ||
                    s.Company.User.Email.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync();
            var rows = await query
                .Include(s => s.Lines)
                .OrderByDescending(s => s.SydneyBillingDate)
                .ThenByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.StatementId,
                    s.CompanyId,
                    CompanyName = s.Company.CompanyName,
                    s.SydneyBillingDate,
                    s.Status,
                    s.TotalAmount,
                    s.PaymentMethod,
                    s.PaidAt,
                    s.PaymentReference,
                    s.ApprovedAt,
                    LineCount = s.Lines.Count,
                    FirstCourse = s.Lines.OrderBy(l => l.LineId).Select(l => l.CourseNameSnapshot).FirstOrDefault(),
                    FirstStudent = s.Lines.OrderBy(l => l.LineId).Select(l => l.StudentNameSnapshot).FirstOrDefault()
                })
                .ToListAsync();

            var items = rows.Select(s => new CompanyBillingStatementListItemDto
            {
                StatementId = s.StatementId.ToString(),
                CompanyId = s.CompanyId.ToString(),
                CompanyName = s.CompanyName,
                SydneyBillingDate = s.SydneyBillingDate.ToString("yyyy-MM-dd"),
                Status = s.Status,
                TotalAmount = s.TotalAmount,
                PaymentMethod = s.PaymentMethod,
                PaidAt = s.PaidAt,
                PaymentReference = s.PaymentReference,
                ApprovedAt = s.ApprovedAt,
                LineCount = s.LineCount,
                PrimaryCourseName = s.LineCount == 1 ? s.FirstCourse : null,
                PrimaryStudentName = s.LineCount == 1 ? s.FirstStudent : null
            }).ToList();

            return new CompanyBillingStatementListResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<CompanyBillingStatementDetailDto?> GetStatementDetailAsync(Guid statementId)
        {
            var s = await _context.CompanyBillingStatements
                .AsNoTracking()
                .Include(x => x.Company)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(x => x.StatementId == statementId);

            if (s == null) return null;

            var lines = await _context.CompanyBillingLines
                .AsNoTracking()
                .Where(l => l.StatementId == statementId)
                .Join(_context.Enrollments, l => l.EnrollmentId, e => e.EnrollmentId, (l, e) => new { l, e })
                .Join(_context.Students, x => x.e.StudentId, st => st.StudentId, (x, st) => new CompanyBillingLineItemDto
                {
                    LineId = x.l.LineId.ToString(),
                    EnrollmentId = x.e.EnrollmentId.ToString(),
                    Amount = x.l.Amount,
                    CourseName = x.l.CourseNameSnapshot,
                    StudentName = x.l.StudentNameSnapshot ?? st.FullName,
                    StudentEmail = st.Email,
                    EnrolledAt = x.e.EnrolledAt
                })
                .ToListAsync();

            return new CompanyBillingStatementDetailDto
            {
                StatementId = s.StatementId.ToString(),
                CompanyId = s.CompanyId.ToString(),
                CompanyName = s.Company.CompanyName,
                SydneyBillingDate = s.SydneyBillingDate.ToString("yyyy-MM-dd"),
                Status = s.Status,
                TotalAmount = s.TotalAmount,
                PaymentMethod = s.PaymentMethod,
                PaidAt = s.PaidAt,
                PaymentReference = s.PaymentReference,
                ApprovedAt = s.ApprovedAt,
                LineCount = lines.Count,
                Lines = lines.OrderByDescending(l => l.EnrolledAt).ToList()
            };
        }

        public async Task<bool> UpdateStatementAsync(
            Guid statementId,
            string status,
            Guid? approvedByUserId,
            string? paymentMethod,
            string? paymentReference)
        {
            var s = await _context.CompanyBillingStatements.FirstOrDefaultAsync(x => x.StatementId == statementId);
            if (s == null) return false;

            var newStatus = status.Trim();
            if (newStatus != "Approved" && newStatus != "Paid")
                return false;

            if (newStatus == "Approved")
            {
                if (s.Status != "Draft")
                    return false;
                s.ApprovedAt = DateTime.UtcNow;
                s.ApprovedBy = approvedByUserId;
                s.Status = "Approved";
            }
            else if (newStatus == "Paid")
            {
                if (s.Status != "Draft" && s.Status != "Approved" && s.Status != "Unpaid")
                    return false;
                s.PaidAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(paymentMethod))
                    s.PaymentMethod = paymentMethod.Trim();
                if (!string.IsNullOrWhiteSpace(paymentReference))
                    s.PaymentReference = paymentReference.Trim();
                s.Status = "Paid";
            }

            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CompanyBillingStatementListResponseDto> GetStatementsForCompanyAsync(Guid companyId, int page, int pageSize)
        {
            var query = _context.CompanyBillingStatements
                .AsNoTracking()
                .Where(s => s.CompanyId == companyId);

            var totalCount = await query.CountAsync();
            var rows = await query
                .Include(s => s.Company)
                .Include(s => s.Lines)
                .OrderByDescending(s => s.SydneyBillingDate)
                .ThenByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.StatementId,
                    s.CompanyId,
                    CompanyName = s.Company.CompanyName,
                    s.SydneyBillingDate,
                    s.Status,
                    s.TotalAmount,
                    s.PaymentMethod,
                    s.PaidAt,
                    s.PaymentReference,
                    s.ApprovedAt,
                    LineCount = s.Lines.Count,
                    FirstCourse = s.Lines.OrderBy(l => l.LineId).Select(l => l.CourseNameSnapshot).FirstOrDefault(),
                    FirstStudent = s.Lines.OrderBy(l => l.LineId).Select(l => l.StudentNameSnapshot).FirstOrDefault()
                })
                .ToListAsync();

            var items = rows.Select(s => new CompanyBillingStatementListItemDto
            {
                StatementId = s.StatementId.ToString(),
                CompanyId = s.CompanyId.ToString(),
                CompanyName = s.CompanyName,
                SydneyBillingDate = s.SydneyBillingDate.ToString("yyyy-MM-dd"),
                Status = s.Status,
                TotalAmount = s.TotalAmount,
                PaymentMethod = s.PaymentMethod,
                PaidAt = s.PaidAt,
                PaymentReference = s.PaymentReference,
                ApprovedAt = s.ApprovedAt,
                LineCount = s.LineCount,
                PrimaryCourseName = s.LineCount == 1 ? s.FirstCourse : null,
                PrimaryStudentName = s.LineCount == 1 ? s.FirstStudent : null
            }).ToList();

            return new CompanyBillingStatementListResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }
    }
}
