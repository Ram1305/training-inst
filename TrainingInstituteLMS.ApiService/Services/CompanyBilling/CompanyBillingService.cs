using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Common;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using EnrollmentEntity = TrainingInstituteLMS.Data.Entities.Enrollments.Enrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Services.CompanyBilling
{
    public class CompanyBillingService : ICompanyBillingService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<CompanyBillingService> _logger;
        private readonly IFileStorageService _fileStorageService;
        private readonly IEmailService _emailService;

        public CompanyBillingService(
            TrainingLMSDbContext context,
            ILogger<CompanyBillingService> logger,
            IFileStorageService fileStorageService,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _emailService = emailService;
        }

        private static Guid? ResolveBillingCompanyId(EnrollmentEntity enrollment)
        {
            var link = enrollment.EnrollmentLink;
            if (link == null) return null;
            if (link.CompanyId.HasValue)
                return link.CompanyId.Value;
            if (link.CompanyOrderId.HasValue && link.CompanyOrder != null)
                return link.CompanyOrder.CompanyId;
            return null;
        }

        private async Task CreateUnpaidCompanyStatementCoreAsync(
            EnrollmentEntity enrollment,
            Guid companyId,
            CancellationToken cancellationToken = default)
        {
            var amount = enrollment.Course?.Price ?? 0;
            var anchorUtc = enrollment.EnrolledAt.Kind == DateTimeKind.Utc
                ? enrollment.EnrolledAt
                : DateTime.SpecifyKind(enrollment.EnrolledAt.ToUniversalTime(), DateTimeKind.Utc);
            var sydneyDate = AustraliaSydneyTime.UtcInstantToSydneyDateOnly(anchorUtc);
            var courseName = enrollment.Course?.CourseName;
            var studentName = enrollment.Student?.FullName;

            var statement = new CompanyBillingStatement
            {
                StatementId = Guid.NewGuid(),
                CompanyId = companyId,
                SydneyBillingDate = sydneyDate,
                Status = "Unpaid",
                TotalAmount = amount,
                PaidAmount = 0,
                CreatedAt = DateTime.UtcNow
            };
            _context.CompanyBillingStatements.Add(statement);

            var line = new CompanyBillingLine
            {
                LineId = Guid.NewGuid(),
                StatementId = statement.StatementId,
                EnrollmentId = enrollment.EnrollmentId,
                Amount = amount,
                CourseNameSnapshot = courseName,
                StudentNameSnapshot = studentName
            };
            _context.CompanyBillingLines.Add(line);

            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                "Company billing: created Unpaid statement {StatementId} for enrollment {EnrollmentId} (company {CompanyId})",
                statement.StatementId,
                enrollment.EnrollmentId,
                companyId);
        }

        /// <inheritdoc />
        public async Task<bool> EnsureUnpaidCompanyBillForEnrollmentAsync(Guid enrollmentId, CancellationToken cancellationToken = default)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.EnrollmentLink!)
                    .ThenInclude(l => l.CompanyOrder)
                .Include(e => e.Course)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId, cancellationToken);

            if (enrollment == null)
                return false;

            if (!string.Equals(enrollment.EnrollmentType, "Company", StringComparison.OrdinalIgnoreCase))
                return false;

            if (await _context.CompanyBillingLines.AnyAsync(l => l.EnrollmentId == enrollmentId, cancellationToken))
                return true;

            if (string.Equals(enrollment.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                return true;

            var companyId = ResolveBillingCompanyId(enrollment);
            if (!companyId.HasValue)
                return false;

            await CreateUnpaidCompanyStatementCoreAsync(enrollment, companyId.Value, cancellationToken);
            return true;
        }

        /// <inheritdoc />
        public async Task BackfillUnpaidCompanyBillsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.EnrollmentLink!)
                    .ThenInclude(l => l.CompanyOrder)
                .Include(e => e.Course)
                .Include(e => e.Student)
                .Where(e =>
                    e.EnrollmentType == "Company" &&
                    e.EnrollmentLink != null &&
                    (
                        e.EnrollmentLink.CompanyId == companyId ||
                        (e.EnrollmentLink.CompanyOrderId != null &&
                         e.EnrollmentLink.CompanyOrder != null &&
                         e.EnrollmentLink.CompanyOrder.CompanyId == companyId)))
                .ToListAsync(cancellationToken);

            foreach (var e in enrollments)
            {
                if (string.Equals(e.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                    continue;

                if (await _context.CompanyBillingLines.AnyAsync(l => l.EnrollmentId == e.EnrollmentId, cancellationToken))
                    continue;

                var cid = ResolveBillingCompanyId(e);
                if (!cid.HasValue || cid.Value != companyId)
                    continue;

                await CreateUnpaidCompanyStatementCoreAsync(e, cid.Value, cancellationToken);
            }
        }

        /// <summary>
        /// Company billing no longer uses Draft/Approved gating: any open balance is Unpaid so the portal payment list works immediately.
        /// </summary>
        private async Task NormalizeOutstandingStatementsToUnpaidAsync(Guid? restrictToCompanyId, CancellationToken cancellationToken = default)
        {
            var q = _context.CompanyBillingStatements.Where(s =>
                (s.Status == "Approved" || s.Status == "Draft") &&
                s.PaidAmount < s.TotalAmount);
            if (restrictToCompanyId.HasValue)
                q = q.Where(s => s.CompanyId == restrictToCompanyId.Value);

            var n = await q.ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(s => s.Status, "Unpaid")
                    .SetProperty(s => s.UpdatedAt, DateTime.UtcNow),
                cancellationToken);
            if (n > 0)
                _logger.LogInformation("Company billing: normalized {Count} statement(s) from Draft/Approved to Unpaid.", n);
        }

        /// <inheritdoc />
        public Task NormalizeLegacyBillingStatusesForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
            NormalizeOutstandingStatementsToUnpaidAsync(companyId, cancellationToken);

        /// <inheritdoc />
        public async Task<bool> RecordPortalEnrollmentTrainingCompletedAsync(Guid enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.EnrollmentLink!)
                    .ThenInclude(l => l.CompanyOrder)
                .Include(e => e.Course)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null)
                return false;

            if (!string.Equals(enrollment.EnrollmentType, "Company", StringComparison.OrdinalIgnoreCase))
                return false;

            var companyId = ResolveBillingCompanyId(enrollment);
            if (!companyId.HasValue)
                return false;

            var hasLine = await _context.CompanyBillingLines.AnyAsync(l => l.EnrollmentId == enrollmentId);

            if (!hasLine && !string.Equals(enrollment.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                await CreateUnpaidCompanyStatementCoreAsync(enrollment, companyId.Value);

            if (enrollment.Status != "Completed")
            {
                enrollment.Status = "Completed";
                enrollment.CompletedAt ??= DateTime.UtcNow;
            }
            else if (!enrollment.CompletedAt.HasValue)
                enrollment.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CompanyBillingStatementListResponseDto> GetAdminStatementsAsync(
            int page,
            int pageSize,
            string? status,
            string? search,
            Guid? companyId)
        {
            await NormalizeOutstandingStatementsToUnpaidAsync(companyId);

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
                    s.PaidAmount,
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
                PaidAmount = s.PaidAmount,
                BalanceDue = s.TotalAmount - s.PaidAmount,
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
            await _context.CompanyBillingStatements
                .Where(x => x.StatementId == statementId
                    && (x.Status == "Approved" || x.Status == "Draft")
                    && x.PaidAmount < x.TotalAmount)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Status, "Unpaid")
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow));

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
                PaidAmount = s.PaidAmount,
                BalanceDue = s.TotalAmount - s.PaidAmount,
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
            // No Draft → Approved workflow: companies pay Unpaid lines directly; admin only marks Paid or legacy data is normalized to Unpaid.
            if (!string.Equals(newStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                return false;

            if (s.Status != "Draft" && s.Status != "Approved" && s.Status != "Unpaid" && s.Status != "PartiallyPaid")
                return false;
            s.PaidAt = DateTime.UtcNow;
            s.PaidAmount = s.TotalAmount;
            if (!string.IsNullOrWhiteSpace(paymentMethod))
                s.PaymentMethod = paymentMethod.Trim();
            if (!string.IsNullOrWhiteSpace(paymentReference))
                s.PaymentReference = paymentReference.Trim();
            s.Status = "Paid";

            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CompanyBillingStatementListResponseDto> GetStatementsForCompanyAsync(Guid companyId, int page, int pageSize)
        {
            await BackfillUnpaidCompanyBillsForCompanyAsync(companyId);
            await NormalizeOutstandingStatementsToUnpaidAsync(companyId);

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
                    s.PaidAmount,
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
                PaidAmount = s.PaidAmount,
                BalanceDue = s.TotalAmount - s.PaidAmount,
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

        public async Task<(bool Ok, string? Error)> ApplyCompanyBillingPaymentAsync(
            Guid companyId,
            IReadOnlyList<Guid> statementIdsInOrder,
            decimal paymentAmount,
            string paymentMethod,
            string paymentReference,
            string? gatewayTransactionId)
        {
            if (paymentAmount <= 0)
                return (false, "Payment amount must be greater than zero.");

            if (statementIdsInOrder.Count == 0)
                return (false, "Select at least one bill.");

            await NormalizeOutstandingStatementsToUnpaidAsync(companyId);

            var idSet = statementIdsInOrder.ToHashSet();
            var statements = await _context.CompanyBillingStatements
                .Where(s => idSet.Contains(s.StatementId) && s.CompanyId == companyId)
                .ToListAsync();

            if (statements.Count != idSet.Count)
                return (false, "One or more bills were not found for your company.");

            var ordered = statementIdsInOrder
                .Select(id => statements.First(s => s.StatementId == id))
                .ToList();

            decimal maxApplicable = 0;
            foreach (var s in ordered)
            {
                var bal = s.TotalAmount - s.PaidAmount;
                if (bal > 0) maxApplicable += bal;
            }

            if (Math.Abs(paymentAmount - maxApplicable) > 0.01m)
                return (false, "Payment amount must exactly match the total balance due on the selected bills.");

            var refSuffix = string.IsNullOrWhiteSpace(gatewayTransactionId)
                ? string.Empty
                : $" txn:{gatewayTransactionId}";

            decimal toAllocate = paymentAmount;
            foreach (var s in ordered)
            {
                var balance = s.TotalAmount - s.PaidAmount;
                if (balance <= 0)
                    continue;

                var apply = Math.Min(toAllocate, balance);
                if (apply <= 0)
                    continue;

                s.PaidAmount += apply;
                toAllocate -= apply;

                s.PaymentMethod = paymentMethod;
                var combinedRef = (paymentReference + refSuffix).Trim();
                if (!string.IsNullOrWhiteSpace(combinedRef))
                {
                    s.PaymentReference = string.IsNullOrWhiteSpace(s.PaymentReference)
                        ? combinedRef
                        : $"{s.PaymentReference}; {combinedRef}";
                }

                if (s.PaidAmount >= s.TotalAmount)
                {
                    s.Status = "Paid";
                    s.PaidAt ??= DateTime.UtcNow;
                }
                else if (s.PaidAmount > 0)
                    s.Status = "PartiallyPaid";

                s.UpdatedAt = DateTime.UtcNow;
            }

            if (toAllocate > 0.01m)
                return (false, "Could not allocate the full payment (internal error).");

            await _context.SaveChangesAsync();
            return (true, null);
        }

        public async Task<CompanyBillingBankTransferSubmissionResponseDto?> SubmitCompanyBankTransferAsync(
            Guid companyId,
            IReadOnlyList<Guid> statementIdsInOrder,
            decimal amount,
            string? customerReference,
            IFormFile receipt,
            CancellationToken cancellationToken = default)
        {
            if (statementIdsInOrder.Count == 0)
                return null;

            await NormalizeOutstandingStatementsToUnpaidAsync(companyId, cancellationToken);

            if (!_fileStorageService.ValidateFile(receipt, out var fileErr))
                throw new InvalidOperationException(fileErr);

            var idSet = statementIdsInOrder.ToHashSet();
            var statements = await _context.CompanyBillingStatements
                .Include(s => s.Lines)
                .Include(s => s.Company)
                .ThenInclude(c => c.User)
                .Where(s => idSet.Contains(s.StatementId) && s.CompanyId == companyId)
                .ToListAsync();

            if (statements.Count != idSet.Count)
                throw new InvalidOperationException("One or more bills were not found for your company.");

            decimal maxApplicable = statements.Sum(s => Math.Max(0, s.TotalAmount - s.PaidAmount));
            if (amount <= 0 || Math.Abs(amount - maxApplicable) > 0.01m)
                throw new InvalidOperationException("Amount must exactly match the total balance due on the selected bills.");

            var upload = await _fileStorageService.UploadFileAsync(receipt, "payment-receipts", cancellationToken);
            if (!upload.Success || string.IsNullOrWhiteSpace(upload.RelativePath))
                throw new InvalidOperationException(upload.ErrorMessage ?? "Receipt upload failed.");

            var submission = new CompanyBillingPaymentSubmission
            {
                SubmissionId = Guid.NewGuid(),
                CompanyId = companyId,
                Amount = amount,
                Method = "bank_transfer",
                ReceiptFileUrl = upload.RelativePath,
                CustomerReference = customerReference?.Trim(),
                StatementIdsJson = JsonSerializer.Serialize(statementIdsInOrder),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _context.CompanyBillingPaymentSubmissions.Add(submission);
            await _context.SaveChangesAsync(cancellationToken);

            var company = statements[0].Company;

            var companyEmail = company.User?.Email ?? string.Empty;
            await _emailService.SendCompanyBillingBankTransferSubmittedAsync(
                companyEmail,
                company.CompanyName,
                amount,
                submission.SubmissionId.ToString(),
                await FormatBillingPaymentSummaryAsync(statementIdsInOrder, companyId));

            return new CompanyBillingBankTransferSubmissionResponseDto
            {
                SubmissionId = submission.SubmissionId.ToString(),
                Message = "Bank transfer notice received. We will verify your deposit and update your balance."
            };
        }

        public async Task<(bool Ok, string? Error)> ApplyBankSubmissionAsync(Guid submissionId)
        {
            var sub = await _context.CompanyBillingPaymentSubmissions
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);
            if (sub == null)
                return (false, "Submission not found.");
            if (!string.Equals(sub.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                return (false, "Submission is not pending.");

            var ids = JsonSerializer.Deserialize<List<Guid>>(sub.StatementIdsJson);
            if (ids == null || ids.Count == 0)
                return (false, "Invalid submission data.");

            var refText = string.IsNullOrWhiteSpace(sub.CustomerReference)
                ? $"Bank submission {sub.SubmissionId:N}"
                : sub.CustomerReference.Trim();

            var (ok, err) = await ApplyCompanyBillingPaymentAsync(
                sub.CompanyId,
                ids,
                sub.Amount,
                "bank_transfer",
                refText,
                null);

            if (!ok)
                return (false, err);

            sub.Status = "Applied";
            sub.AppliedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, null);
        }

        public async Task<string> FormatBillingPaymentSummaryAsync(IReadOnlyList<Guid> statementIdsInOrder, Guid companyId)
        {
            var lines = new List<string>();
            foreach (var sid in statementIdsInOrder)
            {
                var stmt = await _context.CompanyBillingStatements
                    .AsNoTracking()
                    .Include(s => s.Lines)
                    .FirstOrDefaultAsync(s => s.StatementId == sid && s.CompanyId == companyId);
                if (stmt == null)
                    continue;

                foreach (var line in stmt.Lines.OrderBy(l => l.LineId))
                {
                    var who = line.StudentNameSnapshot ?? "Student";
                    var course = line.CourseNameSnapshot ?? "Course";
                    lines.Add($"- {who} — {course} — {line.Amount:C} (statement {sid:N})");
                }
            }

            return lines.Count > 0 ? string.Join("\n", lines) : "(no line detail)";
        }
    }
}
