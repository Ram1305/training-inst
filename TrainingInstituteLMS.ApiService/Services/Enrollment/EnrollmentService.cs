using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment;

namespace TrainingInstituteLMS.ApiService.Services.Enrollment
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly IEmailService _emailService;
        private readonly ILogger<EnrollmentService> _logger;

        public EnrollmentService(
            TrainingLMSDbContext context,
            IFileStorageService fileStorageService,
            IEmailService emailService,
            ILogger<EnrollmentService> logger)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<List<StudentBrowseCourseDto>> GetAvailableCoursesForStudentAsync(Guid studentId, string? searchQuery = null)
        {
            // Get courses the student is already enrolled in
            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status != "Cancelled")
                .Select(e => e.CourseId)
                .ToListAsync();

            // Get active courses not yet enrolled
            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.CourseDates.Where(d => d.IsActive && d.ScheduledDate.Date >= DateTime.UtcNow.Date))
                .Where(c => c.IsActive && !enrolledCourseIds.Contains(c.CourseId))
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var search = searchQuery.ToLower();
                query = query.Where(c =>
                    c.CourseName.ToLower().Contains(search) ||
                    c.CourseCode.ToLower().Contains(search) ||
                    (c.Category != null && c.Category.CategoryName.ToLower().Contains(search)));
            }

            var courses = await query.OrderBy(c => c.CourseName).ToListAsync();

            return courses.Select(c => 
            {
                // Get active course dates for this course
                var activeDates = c.CourseDates
                    .Where(d => d.IsActive && d.ScheduledDate.Date >= DateTime.UtcNow.Date)
                    .ToList();

                // Group dates by day (ScheduledDate.Date) and create unique date entries
                var uniqueDates = activeDates
                    .GroupBy(d => d.ScheduledDate.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => 
                    {
                        var datesOnThisDay = g.ToList();
                        var firstDate = datesOnThisDay.First();
                        var sessionTypes = string.Join(", ", datesOnThisDay.Select(d => d.DateType).Distinct().OrderBy(t => t));
                        var locations = datesOnThisDay.Select(d => d.Location).Distinct().ToList();
                        
                        // Calculate total available spots (minimum across all sessions, or sum if unlimited)
                        var hasCapacityLimit = datesOnThisDay.Any(d => d.MaxCapacity.HasValue);
                        int availableSpots;
                        if (hasCapacityLimit)
                        {
                            // Use minimum available spots across sessions with limits
                            availableSpots = datesOnThisDay
                                .Where(d => d.MaxCapacity.HasValue)
                                .Min(d => d.MaxCapacity!.Value - d.CurrentEnrollments);
                        }
                        else
                        {
                            availableSpots = int.MaxValue;
                        }

                        // Date is available if at least one session is available
                        var isAvailable = datesOnThisDay.Any(d => 
                            !d.MaxCapacity.HasValue || d.CurrentEnrollments < d.MaxCapacity.Value);

                        return new AvailableDateDto
                        {
                            CourseDateId = firstDate.CourseDateId,
                            ScheduledDate = g.Key,
                            SessionCount = datesOnThisDay.Count,
                            SessionTypes = sessionTypes,
                            Location = locations.Count == 1 ? locations.First() : null,
                            AvailableSpots = availableSpots,
                            IsAvailable = isAvailable
                        };
                    })
                    .ToList();

                return new StudentBrowseCourseDto
                {
                    CourseId = c.CourseId,
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    CategoryName = c.Category?.CategoryName,
                    Duration = c.Duration,
                    Price = c.Price,
                    OriginalPrice = c.OriginalPrice,
                    ImageUrl = GetImageFullUrl(c.ImageUrl),
                    HasTheory = c.CourseRule?.HasTheory ?? true,
                    HasPractical = c.CourseRule?.HasPractical ?? true,
                    HasExam = c.CourseRule?.HasExam ?? true,
                    ValidityPeriod = c.ValidityPeriod,
                    Description = c.Description,
                    EnrolledStudentsCount = c.EnrolledStudentsCount,
                    NextBatchDate = uniqueDates.FirstOrDefault()?.ScheduledDate,
                    AvailableDates = uniqueDates
                };
            }).ToList();
        }

        public async Task<List<StudentEnrolledCourseDto>> GetStudentEnrolledCoursesAsync(Guid studentId)
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Include(e => e.Course)
                    .ThenInclude(c => c.CourseRule)
                .Include(e => e.CourseDate)
                .Where(e => e.StudentId == studentId && e.Status != "Cancelled")
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            return enrollments.Select(e =>
            {
                var selectedTheory = e.SelectedTheoryDateId.HasValue
                    ? _context.CourseDates.Where(d => d.CourseDateId == e.SelectedTheoryDateId).Select(d => (DateTime?)d.ScheduledDate).FirstOrDefault()
                    : null;
                var selectedExam = e.SelectedExamDateId.HasValue
                    ? _context.CourseDates.Where(d => d.CourseDateId == e.SelectedExamDateId).Select(d => (DateTime?)d.ScheduledDate).FirstOrDefault()
                    : null;
                var selectedCourseDate = e.CourseDate?.ScheduledDate ?? selectedTheory ?? selectedExam;
                return new StudentEnrolledCourseDto
                {
                    EnrollmentId = e.EnrollmentId,
                    CourseId = e.CourseId,
                    CourseCode = e.Course.CourseCode,
                    CourseName = e.Course.CourseName,
                    CategoryName = e.Course.Category?.CategoryName,
                    ImageUrl = GetImageFullUrl(e.Course.ImageUrl),
                    Instructor = null,
                    BatchCode = null,
                    Progress = CalculateProgress(e),
                    TheoryCompleted = 0,
                    TheoryTotal = e.Course.CourseRule?.HasTheory == true ? 10 : 0,
                    PracticalCompleted = 0,
                    PracticalTotal = e.Course.CourseRule?.HasPractical == true ? 5 : 0,
                    Status = e.Status,
                    PaymentStatus = e.PaymentStatus,
                    EnrolledAt = e.EnrolledAt,
                    QuizCompleted = e.QuizCompleted,
                    SelectedCourseDate = selectedCourseDate,
                    SelectedExamDate = selectedExam,
                    SelectedTheoryDate = selectedTheory
                };
            }).ToList();
        }

        public async Task<EnrollmentResponseDto?> CreateEnrollmentAsync(CreateEnrollmentRequestDto request, Guid studentId)
        {
            // Validate student exists
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId && s.IsActive);
            if (student == null)
                throw new ArgumentException("Student not found or inactive");

            // Validate course exists and is active
            var course = await _context.Courses
                .Include(c => c.Category)
                .FirstOrDefaultAsync(c => c.CourseId == request.CourseId && c.IsActive);
            if (course == null)
                throw new ArgumentException("Course not found or inactive");

            // Check if already enrolled
            if (await HasStudentEnrolledInCourseAsync(studentId, request.CourseId))
                throw new ArgumentException("Student is already enrolled in this course");

            // Quiz is now optional - can be taken after payment
            bool isQuizCompleted = false;
            bool isAdminBypassed = false;

            if (request.QuizAttemptId.HasValue)
            {
                var quizAttempt = await _context.PreEnrollmentQuizAttempts
                    .Include(q => q.AdminBypass)
                    .FirstOrDefaultAsync(q => q.QuizAttemptId == request.QuizAttemptId && q.StudentId == studentId);
                
                if (quizAttempt != null)
                {
                    var canEnroll = quizAttempt.IsPassed || quizAttempt.AdminBypass?.IsActive == true;
                    if (canEnroll)
                    {
                        isQuizCompleted = true;
                        isAdminBypassed = quizAttempt.AdminBypass?.IsActive == true;
                    }
                }
            }

            // Validate selected dates if provided
            if (request.SelectedExamDateId.HasValue)
            {
                var examDate = await _context.CourseDates
                    .FirstOrDefaultAsync(d => d.CourseDateId == request.SelectedExamDateId && d.CourseId == request.CourseId && d.IsActive);
                if (examDate == null)
                    throw new ArgumentException("Invalid exam date selected");
            }

            if (request.SelectedTheoryDateId.HasValue)
            {
                var theoryDate = await _context.CourseDates
                    .FirstOrDefaultAsync(d => d.CourseDateId == request.SelectedTheoryDateId && d.CourseId == request.CourseId && d.IsActive);
                if (theoryDate == null)
                    throw new ArgumentException("Invalid theory date selected");
            }

            // Create enrollment
            var enrollment = new Data.Entities.Enrollments.Enrollment
            {
                StudentId = studentId,
                CourseId = request.CourseId,
                QuizAttemptId = request.QuizAttemptId,
                SelectedExamDateId = request.SelectedExamDateId,
                SelectedTheoryDateId = request.SelectedTheoryDateId,
                AmountPaid = 0,
                PaymentStatus = "Pending",
                IsAdminBypassed = isAdminBypassed,
                QuizCompleted = isQuizCompleted,
                Status = "Active",
                EnrolledAt = DateTime.UtcNow
            };

            _context.Enrollments.Add(enrollment);

            // Update course enrollment count
            course.EnrolledStudentsCount++;

            // Update course date enrollment counts
            if (request.SelectedExamDateId.HasValue)
            {
                var examDate = await _context.CourseDates.FindAsync(request.SelectedExamDateId.Value);
                if (examDate != null) examDate.CurrentEnrollments++;
            }

            if (request.SelectedTheoryDateId.HasValue)
            {
                var theoryDate = await _context.CourseDates.FindAsync(request.SelectedTheoryDateId.Value);
                if (theoryDate != null) theoryDate.CurrentEnrollments++;
            }

            await _context.SaveChangesAsync();

            return await GetEnrollmentByIdAsync(enrollment.EnrollmentId);
        }

        public async Task<EnrollmentResponseDto?> GetEnrollmentByIdAsync(Guid enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Include(e => e.QuizAttempt)
                .Include(e => e.PaymentProof)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null) return null;

            return MapToEnrollmentResponseDto(enrollment);
        }

        public async Task<EnrollmentListResponseDto> GetEnrollmentsAsync(EnrollmentFilterRequestDto filter)
        {
            var query = _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Include(e => e.QuizAttempt)
                .Include(e => e.PaymentProof)
                .AsQueryable();

            // Apply filters
            if (filter.StudentId.HasValue)
                query = query.Where(e => e.StudentId == filter.StudentId.Value);

            if (filter.CourseId.HasValue)
                query = query.Where(e => e.CourseId == filter.CourseId.Value);

            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(e => e.Status == filter.Status);

            if (!string.IsNullOrWhiteSpace(filter.PaymentStatus))
                query = query.Where(e => e.PaymentStatus == filter.PaymentStatus);

            if (filter.FromDate.HasValue)
                query = query.Where(e => e.EnrolledAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(e => e.EnrolledAt <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.ToLower();
                query = query.Where(e =>
                    e.Student.FullName.ToLower().Contains(search) ||
                    e.Student.Email.ToLower().Contains(search) ||
                    e.Course.CourseName.ToLower().Contains(search) ||
                    e.Course.CourseCode.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "studentname" => filter.SortDescending
                    ? query.OrderByDescending(e => e.Student.FullName)
                    : query.OrderBy(e => e.Student.FullName),
                "coursename" => filter.SortDescending
                    ? query.OrderByDescending(e => e.Course.CourseName)
                    : query.OrderBy(e => e.Course.CourseName),
                "status" => filter.SortDescending
                    ? query.OrderByDescending(e => e.Status)
                    : query.OrderBy(e => e.Status),
                "paymentstatus" => filter.SortDescending
                    ? query.OrderByDescending(e => e.PaymentStatus)
                    : query.OrderBy(e => e.PaymentStatus),
                _ => filter.SortDescending
                    ? query.OrderByDescending(e => e.EnrolledAt)
                    : query.OrderBy(e => e.EnrolledAt)
            };

            var enrollments = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new EnrollmentListResponseDto
            {
                Enrollments = enrollments.Select(MapToEnrollmentResponseDto).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<bool> CancelEnrollmentAsync(Guid enrollmentId, Guid studentId)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId && e.StudentId == studentId);

            if (enrollment == null) return false;

            // Only allow cancellation if payment is still pending
            if (enrollment.PaymentStatus != "Pending")
                throw new InvalidOperationException("Cannot cancel enrollment after payment has been submitted");

            // Update enrollment status
            enrollment.Status = "Cancelled";

            // Decrement course enrollment count
            enrollment.Course.EnrolledStudentsCount = Math.Max(0, enrollment.Course.EnrolledStudentsCount - 1);

            // Decrement course date counts
            if (enrollment.SelectedExamDateId.HasValue)
            {
                var examDate = await _context.CourseDates.FindAsync(enrollment.SelectedExamDateId.Value);
                if (examDate != null) examDate.CurrentEnrollments = Math.Max(0, examDate.CurrentEnrollments - 1);
            }

            if (enrollment.SelectedTheoryDateId.HasValue)
            {
                var theoryDate = await _context.CourseDates.FindAsync(enrollment.SelectedTheoryDateId.Value);
                if (theoryDate != null) theoryDate.CurrentEnrollments = Math.Max(0, theoryDate.CurrentEnrollments - 1);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PaymentProofResponseDto?> SubmitPaymentProofAsync(
            SubmitPaymentProofRequestDto request,
            IFormFile receiptFile,
            Guid studentId)
        {
            // Validate enrollment
            var enrollment = await _context.Enrollments
                .Include(e => e.PaymentProof)
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.EnrollmentId == request.EnrollmentId && e.StudentId == studentId);

            if (enrollment == null)
                throw new ArgumentException("Enrollment not found");

            if (enrollment.PaymentProof != null && enrollment.PaymentProof.Status == "Pending")
                throw new ArgumentException("A payment proof is already pending verification");

            // Upload the receipt file
            var uploadResult = await _fileStorageService.UploadFileAsync(receiptFile, "payment-receipts");
            if (!uploadResult.Success)
                throw new InvalidOperationException(uploadResult.ErrorMessage ?? "Failed to upload receipt file");

            // Create or update payment proof
            var paymentProof = enrollment.PaymentProof ?? new PaymentProof
            {
                EnrollmentId = enrollment.EnrollmentId,
                StudentId = studentId
            };

            paymentProof.ReceiptFileUrl = uploadResult.RelativePath!;
            paymentProof.TransactionId = request.TransactionId;
            paymentProof.AmountPaid = request.AmountPaid;
            paymentProof.PaymentDate = request.PaymentDate ?? DateTime.UtcNow;
            paymentProof.PaymentMethod = request.PaymentMethod;
            paymentProof.BankName = request.BankName;
            paymentProof.ReferenceNumber = request.ReferenceNumber;
            paymentProof.UploadedAt = DateTime.UtcNow;
            paymentProof.Status = "Pending";
            paymentProof.RejectionReason = null;

            if (enrollment.PaymentProof == null)
            {
                _context.PaymentProofs.Add(paymentProof);
            }

            // Update enrollment payment status
            enrollment.PaymentStatus = "Pending";
            enrollment.AmountPaid = request.AmountPaid;

            await _context.SaveChangesAsync();

            return MapToPaymentProofResponseDto(paymentProof);
        }

        public async Task<PaymentProofResponseDto?> GetPaymentProofAsync(Guid enrollmentId)
        {
            var paymentProof = await _context.PaymentProofs
                .FirstOrDefaultAsync(p => p.EnrollmentId == enrollmentId);

            if (paymentProof == null) return null;

            return MapToPaymentProofResponseDto(paymentProof);
        }

        public async Task<bool> VerifyPaymentAsync(Guid paymentProofId, VerifyPaymentRequestDto request, Guid verifiedBy)
        {
            var paymentProof = await _context.PaymentProofs
                .Include(p => p.Enrollment)
                .FirstOrDefaultAsync(p => p.PaymentProofId == paymentProofId);

            if (paymentProof == null) return false;

            if (request.Approve)
            {
                paymentProof.Status = "Verified";
                paymentProof.VerifiedBy = verifiedBy;
                paymentProof.VerifiedAt = DateTime.UtcNow;
                paymentProof.Enrollment.PaymentStatus = "Verified";
                paymentProof.Enrollment.PaymentVerifiedBy = verifiedBy;
                paymentProof.Enrollment.PaymentVerifiedAt = DateTime.UtcNow;
            }
            else
            {
                paymentProof.Status = "Rejected";
                paymentProof.RejectionReason = request.RejectionReason;
                paymentProof.Enrollment.PaymentStatus = "Rejected";
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CanStudentEnrollAsync(Guid studentId, Guid courseId)
        {
            // Check if student has passed quiz or has bypass
            var hasPassedQuiz = await _context.PreEnrollmentQuizAttempts
                .AnyAsync(q => q.StudentId == studentId && q.IsPassed);

            var hasBypass = await _context.AdminBypasses
                .AnyAsync(b => b.StudentId == studentId && b.IsActive);

            if (!hasPassedQuiz && !hasBypass)
                return false;

            // Check if already enrolled in this course
            var alreadyEnrolled = await HasStudentEnrolledInCourseAsync(studentId, courseId);
            return !alreadyEnrolled;
        }

        public async Task<bool> HasStudentEnrolledInCourseAsync(Guid studentId, Guid courseId)
        {
            return await _context.Enrollments
                .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId && e.Status != "Cancelled");
        }

        #region Admin Payment Operations

        public async Task<AdminPaymentListResponseDto> GetPaymentProofsForAdminAsync(AdminPaymentFilterRequestDto filter)
        {
            var query = _context.PaymentProofs
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Student)
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Course)
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.CourseDate)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(p => p.Status == filter.Status);

            if (filter.StudentId.HasValue)
                query = query.Where(p => p.StudentId == filter.StudentId.Value);

            if (filter.CourseId.HasValue)
                query = query.Where(p => p.Enrollment.CourseId == filter.CourseId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(p => p.UploadedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(p => p.UploadedAt <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.ToLower();
                query = query.Where(p =>
                    p.Enrollment.Student.FullName.ToLower().Contains(search) ||
                    p.Enrollment.Student.Email.ToLower().Contains(search) ||
                    p.Enrollment.Course.CourseName.ToLower().Contains(search) ||
                    p.TransactionId.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "studentname" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Enrollment.Student.FullName)
                    : query.OrderBy(p => p.Enrollment.Student.FullName),
                "coursename" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Enrollment.Course.CourseName)
                    : query.OrderBy(p => p.Enrollment.Course.CourseName),
                "amount" => filter.SortDescending
                    ? query.OrderByDescending(p => p.AmountPaid)
                    : query.OrderBy(p => p.AmountPaid),
                "status" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Status)
                    : query.OrderBy(p => p.Status),
                _ => filter.SortDescending
                    ? query.OrderByDescending(p => p.UploadedAt)
                    : query.OrderBy(p => p.UploadedAt)
            };

            var paymentProofs = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new AdminPaymentListResponseDto
            {
                PaymentProofs = paymentProofs.Select(MapToAdminPaymentProofResponseDto).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<AdminPaymentProofResponseDto?> GetPaymentProofByIdForAdminAsync(Guid paymentProofId)
        {
            var paymentProof = await _context.PaymentProofs
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Student)
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Course)
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.CourseDate)
                .FirstOrDefaultAsync(p => p.PaymentProofId == paymentProofId);

            if (paymentProof == null) return null;

            return MapToAdminPaymentProofResponseDto(paymentProof);
        }

        public async Task<AdminPaymentStatsResponseDto> GetPaymentStatsAsync()
        {
            var paymentProofs = await _context.PaymentProofs
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Student)
                .Include(p => p.Enrollment)
                    .ThenInclude(e => e.Course)
                .ToListAsync();

            var pendingCount = paymentProofs.Count(p => p.Status == "Pending");
            var verifiedCount = paymentProofs.Count(p => p.Status == "Verified");
            var rejectedCount = paymentProofs.Count(p => p.Status == "Rejected");

            var totalVerifiedAmount = paymentProofs
                .Where(p => p.Status == "Verified")
                .Sum(p => p.AmountPaid);

            var totalPendingAmount = paymentProofs
                .Where(p => p.Status == "Pending")
                .Sum(p => p.AmountPaid);

            // Get recent activity (last 10 actions)
            var recentActivity = paymentProofs
                .OrderByDescending(p => p.VerifiedAt ?? p.UploadedAt)
                .Take(10)
                .Select(p => new RecentPaymentActivityDto
                {
                    PaymentProofId = p.PaymentProofId,
                    StudentName = p.Enrollment.Student.FullName,
                    CourseName = p.Enrollment.Course.CourseName,
                    Amount = p.AmountPaid,
                    Status = p.Status,
                    ActivityDate = p.VerifiedAt ?? p.UploadedAt
                })
                .ToList();

            return new AdminPaymentStatsResponseDto
            {
                PendingCount = pendingCount,
                VerifiedCount = verifiedCount,
                RejectedCount = rejectedCount,
                TotalCount = paymentProofs.Count,
                TotalVerifiedAmount = totalVerifiedAmount,
                TotalPendingAmount = totalPendingAmount,
                RecentActivity = recentActivity
            };
        }

        public async Task<(byte[] FileBytes, string ContentType, string FileName)?> DownloadPaymentReceiptAsync(Guid paymentProofId)
        {
            var paymentProof = await _context.PaymentProofs.FindAsync(paymentProofId);
            if (paymentProof == null) return null;

            var fileResult = await _fileStorageService.GetFileAsync(paymentProof.ReceiptFileUrl);
            if (fileResult == null) return null;

            return (fileResult.FileContents, fileResult.ContentType, fileResult.FileName);
        }

        private AdminPaymentProofResponseDto MapToAdminPaymentProofResponseDto(PaymentProof paymentProof)
        {
            // Extract filename from the URL path
            var fileName = Path.GetFileName(paymentProof.ReceiptFileUrl);

            return new AdminPaymentProofResponseDto
            {
                PaymentProofId = paymentProof.PaymentProofId,
                EnrollmentId = paymentProof.EnrollmentId,
                StudentId = paymentProof.StudentId,
                StudentName = paymentProof.Enrollment.Student.FullName,
                StudentEmail = paymentProof.Enrollment.Student.Email,
                CourseId = paymentProof.Enrollment.CourseId,
                CourseCode = paymentProof.Enrollment.Course.CourseCode,
                CourseName = paymentProof.Enrollment.Course.CourseName,
                CoursePrice = paymentProof.Enrollment.Course.Price,
                EnrolledAt = paymentProof.Enrollment.EnrolledAt,
                SelectedCourseDate = paymentProof.Enrollment.CourseDate?.ScheduledDate,
                ReceiptFileUrl = _fileStorageService.GetFileUrl(paymentProof.ReceiptFileUrl),
                ReceiptFileName = fileName,
                TransactionId = paymentProof.TransactionId,
                AmountPaid = paymentProof.AmountPaid,
                PaymentDate = paymentProof.PaymentDate,
                PaymentMethod = paymentProof.PaymentMethod,
                BankName = paymentProof.BankName,
                ReferenceNumber = paymentProof.ReferenceNumber,
                UploadedAt = paymentProof.UploadedAt,
                Status = paymentProof.Status,
                VerifiedBy = paymentProof.VerifiedBy,
                VerifiedByName = null, // Can be populated by joining with Users table if needed
                VerifiedAt = paymentProof.VerifiedAt,
                RejectionReason = paymentProof.RejectionReason
            };
        }

        #endregion

        #region Admin Booking Dashboard

        /// <summary>
        /// Gets weekly booking counts by selected course date (the session date the student chose when enrolling).
        /// Dashboard performs based on CourseDate.ScheduledDate, not enrollment creation date.
        /// </summary>
        public async Task<WeeklyBookingStatsDto> GetWeeklyBookingStatsAsync(DateTime weekStart)
        {
            var weekEnd = weekStart.Date.AddDays(7);
            var dailyStats = new List<DailyBookingStatDto>();

            for (var date = weekStart.Date; date < weekEnd; date = date.AddDays(1))
            {
                // Count by selected course date (session date they chose when enrolling)
                var count = await _context.Enrollments
                    .Where(e => e.CourseDateId != null &&
                                e.Status != "Cancelled" &&
                                e.CourseDate != null &&
                                e.CourseDate.ScheduledDate.Date == date)
                    .CountAsync();

                dailyStats.Add(new DailyBookingStatDto
                {
                    Date = date,
                    TotalCount = count
                });
            }

            return new WeeklyBookingStatsDto { DailyStats = dailyStats };
        }

        /// <summary>
        /// Gets booking details for a given date. Uses selected course date (CourseDate.ScheduledDate),
        /// so the list shows enrollments whose chosen session date is the target date.
        /// </summary>
        public async Task<BookingDetailsResponseDto> GetBookingDetailsByDateAsync(DateTime date, Guid? courseId = null, string? planFilter = null)
        {
            var targetDate = date.Date;

            var query = _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Include(e => e.CourseDate)
                .Where(e => e.CourseDateId != null &&
                            e.Status != "Cancelled" &&
                            e.CourseDate != null &&
                            e.CourseDate.ScheduledDate.Date == targetDate);

            if (courseId.HasValue)
                query = query.Where(e => e.CourseId == courseId.Value);

            // Plan filter: CourseType (Single/Combo) or CategoryId
            if (!string.IsNullOrWhiteSpace(planFilter))
            {
                var planLower = planFilter.ToLower();
                if (planLower == "single" || planLower == "combo")
                {
                    query = query.Where(e => e.Course.CourseType == planFilter);
                }
                else if (Guid.TryParse(planFilter, out var categoryId))
                {
                    query = query.Where(e => e.Course.CategoryId == categoryId);
                }
            }

            var enrollments = await query
                .OrderBy(e => e.CourseDate!.StartTime)
                .ThenBy(e => e.Course.CourseName)
                .ToListAsync();

            // Build courses list for dropdown: unique courses on this date, ordered by enrollment count
            var courseGroups = enrollments
                .GroupBy(e => new { e.CourseId, CourseCode = e.Course.CourseCode, CourseName = e.Course.CourseName, CategoryName = e.Course.Category != null ? e.Course.Category.CategoryName : null, CourseType = e.Course.CourseType ?? "Single" })
                .Select(g => new BookingDetailsCourseDto
                {
                    CourseId = g.Key.CourseId,
                    CourseCode = g.Key.CourseCode ?? string.Empty,
                    CourseName = g.Key.CourseName ?? string.Empty,
                    CategoryName = g.Key.CategoryName,
                    CourseType = g.Key.CourseType,
                    EnrollmentCount = g.Count()
                })
                .OrderByDescending(c => c.EnrollmentCount)
                .ToList();

            var enrollmentDtos = enrollments.Select(e =>
            {
                var cd = e.CourseDate;
                string? sessionTime = null;
                if (cd != null)
                {
                    if (cd.StartTime.HasValue && cd.EndTime.HasValue)
                        sessionTime = $"{cd.StartTime!.Value:hh\\:mm} - {cd.EndTime!.Value:hh\\:mm}";
                    else
                        sessionTime = cd.ScheduledDate.ToString("g");
                }

                return new BookingDetailsEnrollmentDto
                {
                    EnrollmentId = e.EnrollmentId,
                    StudentId = e.StudentId,
                    StudentName = e.Student.FullName,
                    StudentEmail = e.Student.Email,
                    CourseId = e.CourseId,
                    CourseCode = e.Course.CourseCode,
                    CourseName = e.Course.CourseName,
                    CategoryName = e.Course.Category?.CategoryName,
                    CourseType = e.Course.CourseType ?? "Single",
                    SessionTime = sessionTime,
                    Location = cd?.Location,
                    SessionType = cd?.DateType,
                    PaymentStatus = e.PaymentStatus,
                    Status = e.Status,
                    EnrolledAt = e.EnrolledAt
                };
            }).ToList();

            return new BookingDetailsResponseDto
            {
                Date = targetDate,
                Courses = courseGroups,
                Enrollments = enrollmentDtos
            };
        }

        #endregion

        #region Private Helper Methods

        private int CalculateProgress(Data.Entities.Enrollments.Enrollment enrollment)
        {
            // Placeholder progress calculation
            if (enrollment.Status == "Completed") return 100;
            if (enrollment.PaymentStatus != "Verified") return 0;
            return 10; // Basic progress after payment verification
        }

        private EnrollmentResponseDto MapToEnrollmentResponseDto(Data.Entities.Enrollments.Enrollment enrollment)
        {
            return new EnrollmentResponseDto
            {
                EnrollmentId = enrollment.EnrollmentId,
                StudentId = enrollment.StudentId,
                StudentName = enrollment.Student.FullName,
                StudentEmail = enrollment.Student.Email,
                CourseId = enrollment.CourseId,
                CourseCode = enrollment.Course.CourseCode,
                CourseName = enrollment.Course.CourseName,
                CategoryName = enrollment.Course.Category?.CategoryName,
                QuizAttemptId = enrollment.QuizAttemptId,
                QuizScore = enrollment.QuizAttempt?.OverallPercentage ?? 0,
                QuizCompleted = enrollment.QuizCompleted,
                SelectedExamDateId = enrollment.SelectedExamDateId,
                SelectedTheoryDateId = enrollment.SelectedTheoryDateId,
                AmountPaid = enrollment.AmountPaid,
                PaymentStatus = enrollment.PaymentStatus,
                PaymentVerifiedAt = enrollment.PaymentVerifiedAt,
                IsAdminBypassed = enrollment.IsAdminBypassed,
                Status = enrollment.Status,
                EnrolledAt = enrollment.EnrolledAt,
                CompletedAt = enrollment.CompletedAt,
                PaymentProof = enrollment.PaymentProof != null
                    ? MapToPaymentProofResponseDto(enrollment.PaymentProof)
                    : null
            };
        }

        private PaymentProofResponseDto MapToPaymentProofResponseDto(PaymentProof paymentProof)
        {
            return new PaymentProofResponseDto
            {
                PaymentProofId = paymentProof.PaymentProofId,
                EnrollmentId = paymentProof.EnrollmentId,
                ReceiptFileUrl = _fileStorageService.GetFileUrl(paymentProof.ReceiptFileUrl),
                TransactionId = paymentProof.TransactionId,
                AmountPaid = paymentProof.AmountPaid,
                PaymentDate = paymentProof.PaymentDate,
                PaymentMethod = paymentProof.PaymentMethod,
                BankName = paymentProof.BankName,
                ReferenceNumber = paymentProof.ReferenceNumber,
                UploadedAt = paymentProof.UploadedAt,
                Status = paymentProof.Status,
                VerifiedAt = paymentProof.VerifiedAt,
                RejectionReason = paymentProof.RejectionReason
            };
        }

        private string? GetImageFullUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            if (imageUrl.StartsWith("http://") || imageUrl.StartsWith("https://"))
                return imageUrl;

            return _fileStorageService.GetFileUrl(imageUrl);
        }

        #endregion

        public async Task<BookCourseResponseDto?> BookCourseAsync(BookCourseRequestDto request, IFormFile receiptFile)
        {
            // ? Wrap transaction with execution strategy
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // 1. Check if email already exists
                    var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                    if (existingUser != null)
                        throw new ArgumentException("A user with this email already exists. Please login instead.");

                    // 2. Validate course exists and is active
                    var course = await _context.Courses
                        .Include(c => c.Category)
                        .FirstOrDefaultAsync(c => c.CourseId == request.CourseId && c.IsActive);
                    if (course == null)
                        throw new ArgumentException("Course not found or inactive");

                    // 3. Validate selected course date
                    var courseDate = await _context.CourseDates
                        .FirstOrDefaultAsync(d => d.CourseDateId == request.SelectedCourseDateId
                                                  && d.CourseId == request.CourseId
                                                  && d.IsActive
                                                  && d.ScheduledDate.Date >= DateTime.UtcNow.Date);
                    if (courseDate == null)
                        throw new ArgumentException("Invalid or unavailable course date selected");

                    // Check capacity
                    if (courseDate.MaxCapacity.HasValue && courseDate.CurrentEnrollments >= courseDate.MaxCapacity.Value)
                        throw new ArgumentException("Selected course date is fully booked");

                    // 4. Upload the receipt file first
                    var uploadResult = await _fileStorageService.UploadFileAsync(receiptFile, "payment-receipts");
                    if (!uploadResult.Success)
                        throw new InvalidOperationException(uploadResult.ErrorMessage ?? "Failed to upload receipt file");

                    // 5. Create User
                    var user = new User
                    {
                        UserId = Guid.NewGuid(),
                        FullName = request.FullName,
                        Email = request.Email,
                        PhoneNumber = request.Phone,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        LastLoginAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);

                    // 6. Get or create the Student role
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

                    // 7. Assign Student role to user
                    var userRole = new UserRole
                    {
                        UserRoleId = Guid.NewGuid(),
                        UserId = user.UserId,
                        RoleId = studentRole.RoleId,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(userRole);

                    // 8. Create Student record
                    var student = new Student
                    {
                        StudentId = Guid.NewGuid(),
                        UserId = user.UserId,
                        FullName = request.FullName,
                        Email = request.Email,
                        PhoneNumber = request.Phone,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Students.Add(student);

                    // No placeholder quiz - student will take LLND assessment after login

                    // 9. Create Enrollment without quiz
                    var enrollment = new Data.Entities.Enrollments.Enrollment
                    {
                        EnrollmentId = Guid.NewGuid(),
                        StudentId = student.StudentId,
                        CourseId = request.CourseId,
                        QuizAttemptId = null,
                        SelectedExamDateId = request.SelectedCourseDateId,
                        AmountPaid = request.AmountPaid,
                        PaymentStatus = "Pending",
                        IsAdminBypassed = false,
                        QuizCompleted = false,
                        Status = "Active",
                        EnrolledAt = DateTime.UtcNow
                    };
                    _context.Enrollments.Add(enrollment);

                    // 10. Create Payment Proof
                    var paymentProof = new PaymentProof
                    {
                        PaymentProofId = Guid.NewGuid(),
                        EnrollmentId = enrollment.EnrollmentId,
                        StudentId = student.StudentId,
                        ReceiptFileUrl = uploadResult.RelativePath!,
                        TransactionId = request.TransactionId,
                        AmountPaid = request.AmountPaid,
                        PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
                        PaymentMethod = request.PaymentMethod ?? "Bank Transfer",
                        BankName = request.BankName,
                        ReferenceNumber = request.ReferenceNumber,
                        UploadedAt = DateTime.UtcNow,
                        Status = "Pending"
                    };
                    _context.PaymentProofs.Add(paymentProof);

                    // 11. Update course date enrollment count
                    courseDate.CurrentEnrollments++;

                    // 12. Update course enrollment count
                    course.EnrolledStudentsCount++;

                    _logger.LogInformation("BookCourse: Persisting UserId={UserId}, StudentId={StudentId}, Email={Email}", user.UserId, student.StudentId, user.Email);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    _logger.LogInformation("BookCourse: Persisted successfully. StudentId={StudentId}", student.StudentId);

                    // Send enrollment confirmation email to student (and academy)
                    var orderId = enrollment.EnrollmentId.ToString("N")[..8].ToUpperInvariant();
                    try
                    {
                        var studentAddress = FormatStudentAddress(student.ResidentialAddress, student.ResidentialSuburb, student.ResidentialState, student.ResidentialPostcode);
                        await _emailService.SendEnrollmentConfirmationAsync(
                            student.Email,
                            student.FullName,
                            student.Email,
                            student.PhoneNumber ?? string.Empty,
                            studentAddress,
                            course.CourseName,
                            course.CourseCode ?? string.Empty,
                            courseDate.ScheduledDate,
                            courseDate.StartTime,
                            courseDate.EndTime,
                            courseDate.Location,
                            orderId,
                            DateTime.UtcNow,
                            request.AmountPaid,
                            request.PaymentMethod ?? "Bank Transfer",
                            request.Email,
                            request.Password);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Failed to send enrollment confirmation email to {Email}", student.Email);
                    }

                    return new BookCourseResponseDto
                    {
                        UserId = user.UserId,
                        StudentId = student.StudentId,
                        EnrollmentId = enrollment.EnrollmentId,
                        PaymentProofId = paymentProof.PaymentProofId,
                        StudentName = student.FullName,
                        Email = student.Email ?? string.Empty,
                        CourseName = course.CourseName,
                        CourseCode = course.CourseCode,
                        SelectedDate = courseDate.ScheduledDate,
                        AmountPaid = request.AmountPaid,
                        PaymentStatus = "Pending",
                        EnrollmentStatus = "Active",
                        BookedAt = enrollment.EnrolledAt
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "BookCourse: Transaction failed, rolling back. Email={Email}", request.Email);
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

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
    }
}
