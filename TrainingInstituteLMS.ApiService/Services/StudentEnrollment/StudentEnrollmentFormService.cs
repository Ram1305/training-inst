using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment;

namespace TrainingInstituteLMS.ApiService.Services.StudentEnrollment
{
    public class StudentEnrollmentFormService : IStudentEnrollmentFormService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly IEmailService _emailService;
        private readonly ILogger<StudentEnrollmentFormService> _logger;

        public StudentEnrollmentFormService(
            TrainingLMSDbContext context,
            IFileStorageService fileStorageService,
            IEmailService emailService,
            ILogger<StudentEnrollmentFormService> logger)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _emailService = emailService;
            _logger = logger;
        }

        #region Public Operations

        public async Task<PublicEnrollmentFormResponseDto> SubmitPublicEnrollmentFormAsync(SubmitPublicEnrollmentFormRequestDto request)
        {
            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("An account with this email already exists. Please login instead.");
            }

            ValidateEnrollmentFormRequest(request);

            // Determine full name
            var fullName = !string.IsNullOrWhiteSpace(request.FullName) 
                ? request.FullName 
                : $"{request.GivenName} {request.Surname}".Trim();

            // Validate and upload required documents BEFORE adding entities to context.
            // This ensures we fail fast without leaving orphan User/Student in context if upload fails.
            if (string.IsNullOrWhiteSpace(request.PrimaryIdDataUrl))
                throw new InvalidOperationException("Primary Photo ID is required.");
            if (string.IsNullOrWhiteSpace(request.SecondaryIdDataUrl))
                throw new InvalidOperationException("Photo is required.");

            var primaryIdPath = await UploadFileFromDataUrlAsync(
                request.PrimaryIdDataUrl,
                "student-documents/primary-id",
                "primary-id",
                request.PrimaryIdContentType,
                request.PrimaryIdFileName);
            var secondaryIdPath = await UploadFileFromDataUrlAsync(
                request.SecondaryIdDataUrl,
                "student-documents/secondary-id",
                "secondary-id",
                request.SecondaryIdContentType,
                request.SecondaryIdFileName);

            if (string.IsNullOrWhiteSpace(primaryIdPath))
                throw new InvalidOperationException("Failed to upload Primary Photo ID.");
            if (string.IsNullOrWhiteSpace(secondaryIdPath))
                throw new InvalidOperationException("Failed to upload Photo.");

            // Create User (only after uploads succeeded)
            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = fullName,
                Email = request.Email,
                PhoneNumber = request.Phone ?? request.Mobile,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByRole = "Self"
            };

            _context.Users.Add(user);

            // Get or create Student role
            var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
            if (studentRole == null)
            {
                studentRole = new Role
                {
                    RoleId = Guid.NewGuid(),
                    RoleName = "Student",
                    Description = "Student role"
                };
                _context.Roles.Add(studentRole);
            }

            // Assign Student role to user
            var userRole = new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = studentRole.RoleId,
                AssignedAt = DateTime.UtcNow
            };
            _context.UserRoles.Add(userRole);

            // Create Student
            var student = new Student
            {
                StudentId = Guid.NewGuid(),
                UserId = user.UserId,
                FullName = fullName,
                Email = request.Email,
                PhoneNumber = request.Phone ?? request.Mobile,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Students.Add(student);

            // Map the enrollment form data to the student
            MapRequestToStudent(student, request);

            // Assign document URLs (already uploaded above before adding to context)
            student.PrimaryIdDocumentUrl = primaryIdPath;
            student.SecondaryIdDocumentUrl = secondaryIdPath;

            // Mark form as completed and pending review
            student.EnrollmentFormCompleted = true;
            student.EnrollmentFormSubmittedAt = DateTime.UtcNow;
            student.EnrollmentFormStatus = "Pending";

            // Create Quiz Attempt if quiz data is provided
            if (request.TotalQuestions.HasValue && request.SectionResults != null && request.SectionResults.Any())
            {
                var quizAttempt = new PreEnrollmentQuizAttempt
                {
                    QuizAttemptId = Guid.NewGuid(),
                    StudentId = student.StudentId,
                    AttemptDate = DateTime.UtcNow,
                    TotalQuestions = request.TotalQuestions.Value,
                    CorrectAnswers = request.CorrectAnswers ?? 0,
                    OverallPercentage = (decimal)(request.OverallPercentage ?? 0),
                    IsPassed = request.IsPassed ?? false,
                    Status = "Completed",
                    CompletedAt = DateTime.UtcNow
                };

                _context.PreEnrollmentQuizAttempts.Add(quizAttempt);

                // Create Section Results
                foreach (var sectionResult in request.SectionResults)
                {
                    var quizSectionResult = new QuizSectionResult
                    {
                        SectionResultId = Guid.NewGuid(),
                        QuizAttemptId = quizAttempt.QuizAttemptId,
                        SectionName = sectionResult.SectionName,
                        TotalQuestions = sectionResult.TotalQuestions,
                        CorrectAnswers = sectionResult.CorrectAnswers,
                        SectionPercentage = (decimal)sectionResult.SectionPercentage,
                        SectionPassed = sectionResult.SectionPassed
                    };

                    _context.QuizSectionResults.Add(quizSectionResult);
                }
            }

            // Create Enrollment if course is selected
            Data.Entities.Enrollments.Enrollment? enrollment = null;
            string? directPayBookingId = null;
            if (request.CourseId.HasValue && request.CourseDateId.HasValue)
            {
                // Get course price
                var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == request.CourseId.Value);
                var coursePrice = course?.Price ?? 0;

                // Determine payment status and whether to create PaymentProof
                var hasTransactionId = !string.IsNullOrWhiteSpace(request.TransactionId);
                var paymentMethod = MapPaymentMethodForDisplay(request.PaymentMethod);
                var isDirectPay = string.Equals(request.PaymentMethod, "direct_pay", StringComparison.OrdinalIgnoreCase);
                var isBankTransfer = string.Equals(request.PaymentMethod, "bank_transfer", StringComparison.OrdinalIgnoreCase);
                var isPayLater = string.Equals(request.PaymentMethod, "pay_later", StringComparison.OrdinalIgnoreCase);

                // PaymentStatus: "Pending Verification" when transaction ID provided, "Pending" for direct_pay/bank_transfer/pay_later, "Unpaid" otherwise
                var paymentStatus = hasTransactionId
                    ? "Pending Verification"
                    : (isDirectPay || isBankTransfer || isPayLater)
                        ? "Pending"
                        : "Unpaid";

                enrollment = new Data.Entities.Enrollments.Enrollment
                {
                    EnrollmentId = Guid.NewGuid(),
                    StudentId = student.StudentId,
                    CourseId = request.CourseId.Value,
                    CourseDateId = request.CourseDateId.Value,
                    EnrolledAt = DateTime.UtcNow,
                    Status = "Pending",
                    PaymentStatus = paymentStatus
                };

                _context.Enrollments.Add(enrollment);

                // Create PaymentProof when: (1) transaction ID provided, OR (2) direct_pay/bank_transfer (so it shows on admin payment side)
                var shouldCreatePaymentProof = hasTransactionId || isDirectPay || isBankTransfer;
                directPayBookingId = isDirectPay ? await GenerateUnique8DigitBookingIdAsync() : null;
                if (shouldCreatePaymentProof)
                {
                    string receiptFileUrl = string.Empty;
                    if (isBankTransfer)
                    {
                        if (string.IsNullOrWhiteSpace(request.PaymentProofDataUrl))
                        {
                            throw new InvalidOperationException("Payment proof is required for bank transfer");
                        }

                        receiptFileUrl = await UploadPaymentProofFromDataUrlAsync(request);
                    }

                    var transactionIdForProof = hasTransactionId
                        ? request.TransactionId!
                        : isDirectPay
                            ? directPayBookingId!
                            : "Awaiting transfer";

                    var paymentProof = new PaymentProof
                    {
                        PaymentProofId = Guid.NewGuid(),
                        EnrollmentId = enrollment.EnrollmentId,
                        StudentId = student.StudentId,
                        TransactionId = transactionIdForProof,
                        AmountPaid = request.PaymentAmount ?? coursePrice,
                        PaymentDate = DateTime.UtcNow,
                        PaymentMethod = paymentMethod,
                        UploadedAt = DateTime.UtcNow,
                        Status = "Pending",
                        ReceiptFileUrl = receiptFileUrl
                    };

                    _context.PaymentProofs.Add(paymentProof);
                }
            }

            _logger.LogInformation("SubmitPublicEnrollmentForm: Persisting UserId={UserId}, StudentId={StudentId}, Email={Email}", user.UserId, student.StudentId, user.Email);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("SubmitPublicEnrollmentForm: Persisted successfully. StudentId={StudentId}", student.StudentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SubmitPublicEnrollmentForm: SaveChangesAsync failed. UserId={UserId}, StudentId={StudentId}", user.UserId, student.StudentId);
                throw;
            }

            // Send enrollment confirmation email to both student and academy (when course is selected)
            if (enrollment != null)
            {
                try
                {
                    var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == enrollment.CourseId);
                    var courseDate = await _context.CourseDates.FirstOrDefaultAsync(cd => cd.CourseDateId == enrollment.CourseDateId);
                    var paymentMethodDisplay = MapPaymentMethodForDisplay(request.PaymentMethod);
                    var amountPaid = request.PaymentAmount ?? (course?.Price ?? 0);
                    var orderId = directPayBookingId ?? enrollment.EnrollmentId.ToString();

                    var studentAddress = FormatStudentAddress(request.ResidentialAddress, request.ResidentialSuburb, request.ResidentialState, request.ResidentialPostcode);
                    await _emailService.SendEnrollmentConfirmationAsync(
                        request.Email,
                        fullName,
                        request.Email,
                        request.Phone ?? request.Mobile ?? string.Empty,
                        studentAddress,
                        course?.CourseName ?? "Course",
                        course?.CourseCode ?? string.Empty,
                        courseDate?.ScheduledDate,
                        courseDate?.StartTime,
                        courseDate?.EndTime,
                        courseDate?.Location,
                        orderId,
                        DateTime.UtcNow,
                        amountPaid,
                        paymentMethodDisplay,
                        request.Email,
                        request.Password);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send enrollment confirmation email to {Email} for public enrollment", request.Email);
                    // Do not throw - enrollment already succeeded; email failure should not block the response
                }
            }

            return new PublicEnrollmentFormResponseDto
            {
                UserId = user.UserId,
                StudentId = student.StudentId,
                Email = user.Email,
                FullName = user.FullName,
                EnrollmentFormStatus = student.EnrollmentFormStatus ?? "Pending"
            };
        }

        #endregion

        #region Student Operations

        public async Task<EnrollmentFormResponseDto?> GetEnrollmentFormAsync(Guid studentId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);

            if (student == null) return null;

            return MapToEnrollmentFormResponseDto(student);
        }

        public async Task<EnrollmentFormResponseDto?> SubmitEnrollmentFormAsync(Guid studentId, SubmitEnrollmentFormRequestDto request)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);

            if (student == null)
                throw new ArgumentException("Student not found or inactive");

            ValidateEnrollmentFormRequest(request);

            // Map request to student entity
            MapRequestToStudent(student, request);

            // Mark as completed and pending review
            student.EnrollmentFormCompleted = true;
            student.EnrollmentFormSubmittedAt = DateTime.UtcNow;
            student.EnrollmentFormStatus = "Pending";
            student.EnrollmentFormReviewedBy = null;
            student.EnrollmentFormReviewedAt = null;
            student.EnrollmentFormReviewNotes = null;

            // Update full name from form
            student.FullName = $"{request.GivenName} {request.Surname}".Trim();
            student.PreferredName = request.PreferredName;
            student.PhoneNumber = request.Mobile;

            await _context.SaveChangesAsync();

            return MapToEnrollmentFormResponseDto(student);
        }

        public async Task<EnrollmentFormResponseDto?> UpdateEnrollmentFormAsync(Guid studentId, SubmitEnrollmentFormRequestDto request)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);

            if (student == null)
                throw new ArgumentException("Student not found or inactive");

            ValidateEnrollmentFormRequest(request);

            // Map request to student entity
            MapRequestToStudent(student, request);

            // If form was already submitted, keep submission date but reset review
            if (student.EnrollmentFormCompleted)
            {
                student.EnrollmentFormStatus = "Pending";
                student.EnrollmentFormReviewedBy = null;
                student.EnrollmentFormReviewedAt = null;
            }
            else
            {
                student.EnrollmentFormCompleted = true;
                student.EnrollmentFormSubmittedAt = DateTime.UtcNow;
                student.EnrollmentFormStatus = "Pending";
            }

            // Update full name from form
            student.FullName = $"{request.GivenName} {request.Surname}".Trim();
            student.PreferredName = request.PreferredName;
            student.PhoneNumber = request.Mobile;

            await _context.SaveChangesAsync();

            return MapToEnrollmentFormResponseDto(student);
        }

        public async Task<string?> UploadDocumentAsync(Guid studentId, IFormFile file, string documentType)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);

            if (student == null)
                throw new ArgumentException("Student not found or inactive");

            var folder = documentType switch
            {
                "primaryId" => "student-documents/primary-id",
                "secondaryId" => "student-documents/secondary-id",
                "usiId" => "student-documents/usi-id",
                "qualification" => "student-documents/qualifications",
                _ => "student-documents/other"
            };

            var uploadResult = await _fileStorageService.UploadFileAsync(file, folder);
            if (!uploadResult.Success)
                throw new InvalidOperationException(uploadResult.ErrorMessage ?? "Failed to upload file");

            // Update the appropriate field on the student
            switch (documentType)
            {
                case "primaryId":
                    student.PrimaryIdDocumentUrl = uploadResult.RelativePath;
                    break;
                case "secondaryId":
                    student.SecondaryIdDocumentUrl = uploadResult.RelativePath;
                    break;
                case "usiId":
                    student.USIIdDocumentUrl = uploadResult.RelativePath;
                    break;
                case "qualification":
                    student.QualificationEvidenceUrl = uploadResult.RelativePath;
                    break;
            }

            await _context.SaveChangesAsync();

            return _fileStorageService.GetFileUrl(uploadResult.RelativePath!);
        }

        #endregion

        #region Admin Operations

        public async Task<EnrollmentFormListResponseDto> GetEnrollmentFormsForAdminAsync(EnrollmentFormFilterRequestDto filter)
        {
            var query = _context.Students
                .Where(s => s.EnrollmentFormCompleted)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(s => s.EnrollmentFormStatus == filter.Status);

            if (filter.FromDate.HasValue)
                query = query.Where(s => s.EnrollmentFormSubmittedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(s => s.EnrollmentFormSubmittedAt <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.ToLower();
                query = query.Where(s =>
                    s.FullName.ToLower().Contains(search) ||
                    s.Email.ToLower().Contains(search) ||
                    (s.Surname != null && s.Surname.ToLower().Contains(search)) ||
                    (s.GivenName != null && s.GivenName.ToLower().Contains(search)));
            }

            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "fullname" => filter.SortDescending
                    ? query.OrderByDescending(s => s.FullName)
                    : query.OrderBy(s => s.FullName),
                "email" => filter.SortDescending
                    ? query.OrderByDescending(s => s.Email)
                    : query.OrderBy(s => s.Email),
                "status" => filter.SortDescending
                    ? query.OrderByDescending(s => s.EnrollmentFormStatus)
                    : query.OrderBy(s => s.EnrollmentFormStatus),
                _ => filter.SortDescending
                    ? query.OrderByDescending(s => s.EnrollmentFormSubmittedAt)
                    : query.OrderBy(s => s.EnrollmentFormSubmittedAt)
            };

            var students = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Get enrollment counts
            var studentIds = students.Select(s => s.StudentId).ToList();
            var enrollmentCounts = await _context.Enrollments
                .Where(e => studentIds.Contains(e.StudentId) && e.Status != "Cancelled")
                .GroupBy(e => e.StudentId)
                .Select(g => new { StudentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.StudentId, x => x.Count);

            return new EnrollmentFormListResponseDto
            {
                EnrollmentForms = students.Select(s => new EnrollmentFormListItemDto
                {
                    StudentId = s.StudentId,
                    FullName = s.FullName,
                    Email = s.Email,
                    PhoneNumber = s.Mobile ?? s.PhoneNumber,
                    DateOfBirth = s.DateOfBirth,
                    Status = s.EnrollmentFormStatus,
                    SubmittedAt = s.EnrollmentFormSubmittedAt,
                    ReviewedAt = s.EnrollmentFormReviewedAt,
                    ReviewedByName = null, // Can be populated by joining with Users table
                    EnrollmentCount = enrollmentCounts.GetValueOrDefault(s.StudentId, 0),
                    IsActive = s.IsActive
                }).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<EnrollmentFormResponseDto?> GetEnrollmentFormByIdForAdminAsync(Guid studentId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId);

            if (student == null) return null;

            return MapToEnrollmentFormResponseDto(student);
        }

        public async Task<bool> ReviewEnrollmentFormAsync(Guid studentId, ReviewEnrollmentFormRequestDto request, Guid reviewedBy)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId);

            if (student == null) return false;

            student.EnrollmentFormStatus = request.Approve ? "Approved" : "Rejected";
            student.EnrollmentFormReviewedBy = reviewedBy;
            student.EnrollmentFormReviewedAt = DateTime.UtcNow;
            student.EnrollmentFormReviewNotes = request.ReviewNotes;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<EnrollmentFormResponseDto?> UpdateEnrollmentFormByAdminAsync(Guid studentId, SubmitEnrollmentFormRequestDto request, Guid updatedBy)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId);

            if (student == null)
                throw new ArgumentException("Student not found");

            ValidateEnrollmentFormRequest(request);

            // Map request to student entity
            MapRequestToStudent(student, request);

            // Update full name from form
            student.FullName = $"{request.GivenName} {request.Surname}".Trim();
            student.PreferredName = request.PreferredName;
            student.PhoneNumber = request.Mobile;

            // Keep existing status but note that it was updated by admin
            if (!student.EnrollmentFormCompleted)
            {
                student.EnrollmentFormCompleted = true;
                student.EnrollmentFormSubmittedAt = DateTime.UtcNow;
                student.EnrollmentFormStatus = "Approved"; // Admin submission auto-approves
                student.EnrollmentFormReviewedBy = updatedBy;
                student.EnrollmentFormReviewedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return MapToEnrollmentFormResponseDto(student);
        }

        public async Task<EnrollmentFormStatsResponseDto> GetEnrollmentFormStatsAsync()
        {
            var allStudents = await _context.Students
                .Where(s => s.IsActive)
                .Select(s => new
                {
                    s.EnrollmentFormCompleted,
                    s.EnrollmentFormStatus,
                    s.EnrollmentFormSubmittedAt,
                    s.EnrollmentFormReviewedAt
                })
                .ToListAsync();

            var submittedForms = allStudents.Where(s => s.EnrollmentFormCompleted).ToList();

            return new EnrollmentFormStatsResponseDto
            {
                TotalSubmitted = submittedForms.Count,
                PendingCount = submittedForms.Count(s => s.EnrollmentFormStatus == "Pending"),
                ApprovedCount = submittedForms.Count(s => s.EnrollmentFormStatus == "Approved"),
                RejectedCount = submittedForms.Count(s => s.EnrollmentFormStatus == "Rejected"),
                NotSubmittedCount = allStudents.Count(s => !s.EnrollmentFormCompleted),
                LastSubmittedAt = submittedForms.Max(s => s.EnrollmentFormSubmittedAt),
                LastReviewedAt = submittedForms.Where(s => s.EnrollmentFormReviewedAt.HasValue)
                    .Max(s => s.EnrollmentFormReviewedAt)
            };
        }

        #endregion

        #region Private Helper Methods

        /// <summary>
        /// Formats residential address for display in emails.
        /// </summary>
        private static string? FormatStudentAddress(string? street, string? suburb, string? state, string? postcode)
        {
            if (string.IsNullOrWhiteSpace(street) && string.IsNullOrWhiteSpace(suburb))
                return null;
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(street)) parts.Add(street.Trim());
            var locality = string.Join(" ", new[] { suburb, state, postcode }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
            if (!string.IsNullOrWhiteSpace(locality)) parts.Add(locality);
            if (parts.Count == 0) return null;
            parts.Add("Australia");
            return string.Join("\n", parts);
        }

        /// <summary>
        /// Maps frontend payment method values to display-friendly format.
        /// </summary>
        private static string MapPaymentMethodForDisplay(string? paymentMethod)
        {
            if (string.IsNullOrWhiteSpace(paymentMethod)) return "Bank Transfer";

            return paymentMethod.ToLowerInvariant() switch
            {
                "direct_pay" => "Direct Pay",
                "bank_transfer" => "Bank Transfer",
                "card" => "Credit Card",
                _ => paymentMethod
            };
        }

        private async Task<string> UploadPaymentProofFromDataUrlAsync(SubmitPublicEnrollmentFormRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.PaymentProofDataUrl))
                throw new InvalidOperationException("Payment proof is required for bank transfer");

            try
            {
                var result = await UploadFileFromDataUrlAsync(
                    request.PaymentProofDataUrl,
                    "payment-receipts",
                    "payment-proof",
                    request.PaymentProofContentType,
                    request.PaymentProofFileName);
                if (result == null)
                    throw new InvalidOperationException("Invalid payment proof file data");
                return result;
            }
            catch (FormatException)
            {
                throw new InvalidOperationException("Invalid payment proof file data");
            }
        }

        private async Task<string?> UploadFileFromDataUrlAsync(
            string? dataUrl,
            string folder,
            string defaultFileName,
            string? contentType,
            string? fileName)
        {
            var trimmed = dataUrl?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(trimmed))
                return null;

            var base64Payload = trimmed;
            if (trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var commaIndex = trimmed.IndexOf(',');
                if (commaIndex < 0)
                    return null;

                var metadata = trimmed.Substring(5, commaIndex - 5);
                base64Payload = trimmed[(commaIndex + 1)..];

                var metadataParts = metadata.Split(';', StringSplitOptions.RemoveEmptyEntries);
                if (metadataParts.Length > 0 && metadataParts[0].Contains('/'))
                    contentType ??= metadataParts[0];
            }

            var fileBytes = Convert.FromBase64String(base64Payload);
            if (fileBytes.Length == 0)
                return null;

            var name = string.IsNullOrWhiteSpace(fileName) ? defaultFileName : Path.GetFileName(fileName);
            var extension = Path.GetExtension(name);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = GetExtensionFromContentType(contentType);
                if (string.IsNullOrWhiteSpace(extension))
                    extension = ".pdf";
                name = $"{name}{extension}";
            }

            contentType ??= GetContentTypeFromExtension(extension);

            using var stream = new MemoryStream(fileBytes);
            var formFile = new FormFile(stream, 0, fileBytes.Length, "file", name)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };

            var uploadResult = await _fileStorageService.UploadFileAsync(formFile, folder);
            if (!uploadResult.Success || string.IsNullOrWhiteSpace(uploadResult.RelativePath))
                return null;

            return uploadResult.RelativePath;
        }

        private static string? GetExtensionFromContentType(string? contentType)
        {
            if (string.IsNullOrWhiteSpace(contentType)) return null;

            return contentType.ToLowerInvariant() switch
            {
                "application/pdf" => ".pdf",
                "image/jpeg" => ".jpg",
                "image/jpg" => ".jpg",
                "image/png" => ".png",
                _ => null
            };
        }

        private static string GetContentTypeFromExtension(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".pdf" => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }

        /// <summary>
        /// Generates a unique 8-digit random booking ID for direct pay enrollments.
        /// </summary>
        private async Task<string> GenerateUnique8DigitBookingIdAsync()
        {
            var random = new Random();
            string candidate;
            int attempts = 0;
            const int maxAttempts = 20;
            do
            {
                candidate = random.Next(10000000, 100000000).ToString();
                var exists = await _context.PaymentProofs.AnyAsync(p => p.TransactionId == candidate);
                if (!exists) return candidate;
                attempts++;
            } while (attempts < maxAttempts);
            // Fallback: use timestamp-based suffix if collision persists (extremely rare)
            return $"{random.Next(1000000, 9999999)}{DateTime.UtcNow.Millisecond % 10}";
        }

        private static void ValidateEnrollmentFormRequest(SubmitEnrollmentFormRequestDto request)
        {
            // USI: when providing own USI (Apply through STA = No), USI number is required
            if (string.Equals(request.USIApplyThroughSTA, "No", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(request.USI))
                    throw new InvalidOperationException("USI number is required when providing your own USI.");
            }
        }

        private void MapRequestToStudent(Data.Entities.Students.Student student, SubmitEnrollmentFormRequestDto request)
        {
            // Section 1 - Applicant Information
            student.Title = request.Title;
            student.Surname = request.Surname;
            student.GivenName = request.GivenName;
            student.MiddleName = request.MiddleName;
            student.PreferredName = request.PreferredName;
            student.DateOfBirth = request.DateOfBirth;
            student.Gender = request.Gender;
            student.HomePhone = request.HomePhone;
            student.WorkPhone = request.WorkPhone;
            student.Mobile = request.Mobile;

            // Residential Address
            student.ResidentialAddress = request.ResidentialAddress;
            student.ResidentialSuburb = request.ResidentialSuburb;
            student.ResidentialState = request.ResidentialState;
            student.ResidentialPostcode = request.ResidentialPostcode;

            // Postal Address
            student.PostalAddressDifferent = request.PostalAddressDifferent;
            student.PostalAddress = request.PostalAddress;
            student.PostalSuburb = request.PostalSuburb;
            student.PostalState = request.PostalState;
            student.PostalPostcode = request.PostalPostcode;

            // Emergency Contact
            student.EmergencyContactName = request.EmergencyContactName;
            student.EmergencyContactRelationship = request.EmergencyContactRelationship;
            student.EmergencyContactNumber = request.EmergencyContactNumber;
            student.EmergencyPermission = request.EmergencyPermission;

            // Section 2 - USI
            student.USI = request.USI;
            student.USIAccessPermission = request.USIAccessPermission;
            student.USIApplyThroughSTA = request.USIApplyThroughSTA;
            student.USIAuthoriseName = request.USIAuthoriseName;
            student.USIConsent = request.USIConsent ?? false;
            student.TownCityOfBirth = request.TownCityOfBirth;
            student.OverseasCityOfBirth = request.OverseasCityOfBirth;
            student.USIIdType = request.USIIdType;

            // Driver's Licence Details
            student.DriversLicenceState = request.DriversLicenceState;
            student.DriversLicenceNumber = request.DriversLicenceNumber;

            // Medicare Details
            student.MedicareNumber = request.MedicareNumber;
            student.MedicareIRN = request.MedicareIRN;
            student.MedicareCardColor = request.MedicareCardColor;
            student.MedicareExpiry = request.MedicareExpiry;

            // Birth Certificate
            student.BirthCertificateState = request.BirthCertificateState;

            // ImmiCard
            student.ImmiCardNumber = request.ImmiCardNumber;

            // Australian Passport
            student.AustralianPassportNumber = request.AustralianPassportNumber;

            // Non-Australian Passport
            student.NonAustralianPassportNumber = request.NonAustralianPassportNumber;
            student.NonAustralianPassportCountry = request.NonAustralianPassportCountry;

            // Citizenship Certificate
            student.CitizenshipStockNumber = request.CitizenshipStockNumber;
            student.CitizenshipAcquisitionDate = request.CitizenshipAcquisitionDate;

            // Registration by Descent
            student.DescentAcquisitionDate = request.DescentAcquisitionDate;

            // Section 3 - Education and Employment
            student.SchoolLevel = request.SchoolLevel;
            student.SchoolCompleteYear = request.SchoolCompleteYear;
            student.SchoolName = request.SchoolName;
            student.SchoolInAustralia = request.SchoolInAustralia;
            student.SchoolState = request.SchoolState;
            student.SchoolPostcode = request.SchoolPostcode;
            student.SchoolCountry = request.SchoolCountry;
            student.HasPostSecondaryQualification = request.HasPostSecondaryQualification;
            student.QualificationLevels = request.QualificationLevels != null
                ? JsonSerializer.Serialize(request.QualificationLevels)
                : null;
            student.QualificationDetails = request.QualificationDetails;
            student.EmploymentStatus = request.EmploymentStatus;
            student.EmployerName = request.EmployerName;
            student.SupervisorName = request.SupervisorName;
            student.EmployerAddress = request.EmployerAddress;
            student.EmployerEmail = request.EmployerEmail;
            student.EmployerPhone = request.EmployerPhone;
            student.TrainingReason = request.TrainingReason;
            student.TrainingReasonOther = request.TrainingReasonOther;

            // Section 4 - Additional Information
            student.CountryOfBirth = request.CountryOfBirth;
            student.SpeaksOtherLanguage = request.SpeaksOtherLanguage;
            student.HomeLanguage = request.HomeLanguage;
            student.IndigenousStatus = request.IndigenousStatus;
            student.HasDisability = request.HasDisability;
            student.DisabilityTypes = request.DisabilityTypes != null
                ? JsonSerializer.Serialize(request.DisabilityTypes)
                : null;
            student.DisabilityNotes = request.DisabilityNotes;

            // Section 5 - Privacy and Terms
            student.AcceptedPrivacyNotice = request.AcceptedPrivacyNotice;
            student.AcceptedTermsAndConditions = request.AcceptedTermsAndConditions;
            student.DeclarationName = request.DeclarationName;
            student.DeclarationDate = request.DeclarationDate;
            student.SignatureData = request.SignatureData;
        }

        private EnrollmentFormResponseDto MapToEnrollmentFormResponseDto(Data.Entities.Students.Student student)
        {
            return new EnrollmentFormResponseDto
            {
                StudentId = student.StudentId,
                StudentName = student.FullName,
                Email = student.Email,

                // Form Status
                EnrollmentFormCompleted = student.EnrollmentFormCompleted,
                EnrollmentFormSubmittedAt = student.EnrollmentFormSubmittedAt,
                EnrollmentFormStatus = student.EnrollmentFormStatus,
                EnrollmentFormReviewedBy = student.EnrollmentFormReviewedBy,
                EnrollmentFormReviewedAt = student.EnrollmentFormReviewedAt,
                EnrollmentFormReviewNotes = student.EnrollmentFormReviewNotes,

                // Section 1
                Title = student.Title,
                Surname = student.Surname,
                GivenName = student.GivenName,
                MiddleName = student.MiddleName,
                PreferredName = student.PreferredName,
                DateOfBirth = student.DateOfBirth,
                Gender = student.Gender,
                HomePhone = student.HomePhone,
                WorkPhone = student.WorkPhone,
                Mobile = student.Mobile ?? student.PhoneNumber,

                ResidentialAddress = student.ResidentialAddress,
                ResidentialSuburb = student.ResidentialSuburb,
                ResidentialState = student.ResidentialState,
                ResidentialPostcode = student.ResidentialPostcode,

                PostalAddressDifferent = student.PostalAddressDifferent,
                PostalAddress = student.PostalAddress,
                PostalSuburb = student.PostalSuburb,
                PostalState = student.PostalState,
                PostalPostcode = student.PostalPostcode,

                PrimaryIdDocumentUrl = GetDocumentUrl(student.PrimaryIdDocumentUrl),
                SecondaryIdDocumentUrl = GetDocumentUrl(student.SecondaryIdDocumentUrl),

                EmergencyContactName = student.EmergencyContactName,
                EmergencyContactRelationship = student.EmergencyContactRelationship,
                EmergencyContactNumber = student.EmergencyContactNumber,
                EmergencyPermission = student.EmergencyPermission,

                // Section 2
                USI = student.USI,
                USIAccessPermission = student.USIAccessPermission,
                USIApplyThroughSTA = student.USIApplyThroughSTA,
                USIAuthoriseName = student.USIAuthoriseName,
                USIConsent = student.USIConsent,
                TownCityOfBirth = student.TownCityOfBirth,
                OverseasCityOfBirth = student.OverseasCityOfBirth,
                USIIdType = student.USIIdType,
                USIIdDocumentUrl = GetDocumentUrl(student.USIIdDocumentUrl),

                DriversLicenceState = student.DriversLicenceState,
                DriversLicenceNumber = student.DriversLicenceNumber,
                MedicareNumber = student.MedicareNumber,
                MedicareIRN = student.MedicareIRN,
                MedicareCardColor = student.MedicareCardColor,
                MedicareExpiry = student.MedicareExpiry,
                BirthCertificateState = student.BirthCertificateState,
                ImmiCardNumber = student.ImmiCardNumber,
                AustralianPassportNumber = student.AustralianPassportNumber,
                NonAustralianPassportNumber = student.NonAustralianPassportNumber,
                NonAustralianPassportCountry = student.NonAustralianPassportCountry,
                CitizenshipStockNumber = student.CitizenshipStockNumber,
                CitizenshipAcquisitionDate = student.CitizenshipAcquisitionDate,
                DescentAcquisitionDate = student.DescentAcquisitionDate,

                // Section 3
                SchoolLevel = student.SchoolLevel,
                SchoolCompleteYear = student.SchoolCompleteYear,
                SchoolName = student.SchoolName,
                SchoolInAustralia = student.SchoolInAustralia,
                SchoolState = student.SchoolState,
                SchoolPostcode = student.SchoolPostcode,
                SchoolCountry = student.SchoolCountry,
                HasPostSecondaryQualification = student.HasPostSecondaryQualification,
                QualificationLevels = DeserializeList(student.QualificationLevels),
                QualificationDetails = student.QualificationDetails,
                QualificationEvidenceUrl = GetDocumentUrl(student.QualificationEvidenceUrl),
                EmploymentStatus = student.EmploymentStatus,
                EmployerName = student.EmployerName,
                SupervisorName = student.SupervisorName,
                EmployerAddress = student.EmployerAddress,
                EmployerEmail = student.EmployerEmail,
                EmployerPhone = student.EmployerPhone,
                TrainingReason = student.TrainingReason,
                TrainingReasonOther = student.TrainingReasonOther,

                // Section 4
                CountryOfBirth = student.CountryOfBirth,
                SpeaksOtherLanguage = student.SpeaksOtherLanguage,
                HomeLanguage = student.HomeLanguage,
                IndigenousStatus = student.IndigenousStatus,
                HasDisability = student.HasDisability,
                DisabilityTypes = DeserializeList(student.DisabilityTypes),
                DisabilityNotes = student.DisabilityNotes,

                // Section 5
                AcceptedPrivacyNotice = student.AcceptedPrivacyNotice,
                AcceptedTermsAndConditions = student.AcceptedTermsAndConditions,
                DeclarationName = student.DeclarationName,
                DeclarationDate = student.DeclarationDate,
                SignatureData = student.SignatureData
            };
        }

        private string? GetDocumentUrl(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return null;

            return _fileStorageService.GetFileUrl(relativePath);
        }

        private List<string>? DeserializeList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<List<string>>(json);
            }
            catch
            {
                return null;
            }
        }

        #endregion
    }
}
