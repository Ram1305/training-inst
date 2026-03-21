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

        public async Task AddLineForPortalEnrollmentAsync(
            Guid companyId,
            Guid enrollmentId,
            decimal amount,
            string? courseName,
            string? studentName,
            DateTime enrolledAtUtc)
        {
            var sydneyDate = AustraliaSydneyTime.UtcInstantToSydneyDateOnly(enrolledAtUtc);

            if (await _context.CompanyBillingLines.AnyAsync(l => l.EnrollmentId == enrollmentId))
            {
                _logger.LogWarning("Billing line already exists for enrollment {EnrollmentId}", enrollmentId);
                return;
            }

            var draft = await _context.CompanyBillingStatements
                .Where(s => s.CompanyId == companyId && s.SydneyBillingDate == sydneyDate && s.Status == "Draft")
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (draft == null)
            {
                draft = new CompanyBillingStatement
                {
                    StatementId = Guid.NewGuid(),
                    CompanyId = companyId,
                    SydneyBillingDate = sydneyDate,
                    Status = "Draft",
                    TotalAmount = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CompanyBillingStatements.Add(draft);
            }

            var line = new CompanyBillingLine
            {
                LineId = Guid.NewGuid(),
                StatementId = draft.StatementId,
                EnrollmentId = enrollmentId,
                Amount = amount,
                CourseNameSnapshot = courseName,
                StudentNameSnapshot = studentName
            };
            _context.CompanyBillingLines.Add(line);
            draft.TotalAmount += amount;
            draft.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
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
                    LineCount = s.Lines.Count
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
                LineCount = s.LineCount
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
                if (s.Status != "Draft" && s.Status != "Approved")
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
                    LineCount = s.Lines.Count
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
                LineCount = s.LineCount
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
