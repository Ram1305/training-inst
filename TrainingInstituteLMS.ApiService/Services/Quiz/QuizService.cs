using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz;

namespace TrainingInstituteLMS.ApiService.Services.Quiz
{
    public class QuizService : IQuizService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<QuizService> _logger;

        public QuizService(TrainingLMSDbContext context, ILogger<QuizService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GuestQuizSubmissionResultDto> SubmitGuestQuizAsync(SubmitGuestQuizRequestDto request)
        {
            // Use execution strategy for transaction support
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // 1. Check if email already exists
                    var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                    if (existingUser != null)
                    {
                        return new GuestQuizSubmissionResultDto
                        {
                            Success = false,
                            Message = "A user with this email already exists. Please login instead."
                        };
                    }

                    // 2. Create User
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

                    // 3. Get or create the Student role
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

                    // 4. Assign Student role to user
                    var userRole = new UserRole
                    {
                        UserRoleId = Guid.NewGuid(),
                        UserId = user.UserId,
                        RoleId = studentRole.RoleId,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(userRole);

                    // 5. Create Student record
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

                    // 6. Create Quiz Attempt
                    var quizAttempt = new PreEnrollmentQuizAttempt
                    {
                        QuizAttemptId = Guid.NewGuid(),
                        StudentId = student.StudentId,
                        AttemptDate = DateTime.UtcNow,
                        TotalQuestions = request.TotalQuestions,
                        CorrectAnswers = request.CorrectAnswers,
                        OverallPercentage = request.OverallPercentage,
                        IsPassed = request.IsPassed,
                        Status = "Completed",
                        CompletedAt = DateTime.UtcNow
                    };
                    _context.PreEnrollmentQuizAttempts.Add(quizAttempt);

                    // 7. Create section results
                    var sectionResults = new List<QuizSectionResult>();
                    foreach (var sectionDto in request.SectionResults)
                    {
                        var sectionResult = new QuizSectionResult
                        {
                            SectionResultId = Guid.NewGuid(),
                            QuizAttemptId = quizAttempt.QuizAttemptId,
                            SectionName = sectionDto.SectionName,
                            TotalQuestions = sectionDto.TotalQuestions,
                            CorrectAnswers = sectionDto.CorrectAnswers,
                            SectionPercentage = sectionDto.SectionPercentage,
                            SectionPassed = sectionDto.SectionPassed
                        };
                        sectionResults.Add(sectionResult);
                        _context.QuizSectionResults.Add(sectionResult);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation(
                        "Guest quiz submitted successfully. User: {Email}, Student ID: {StudentId}, Quiz Attempt: {QuizAttemptId}, Passed: {IsPassed}",
                        request.Email, student.StudentId, quizAttempt.QuizAttemptId, request.IsPassed);

                    return new GuestQuizSubmissionResultDto
                    {
                        Success = true,
                        Message = request.IsPassed
                            ? "Congratulations! You have passed the pre-enrollment assessment. Your account has been created."
                            : "Assessment completed. Your account has been created. An administrator will review your results.",
                        UserId = user.UserId,
                        StudentId = student.StudentId,
                        Email = user.Email,
                        FullName = user.FullName,
                        QuizAttemptId = quizAttempt.QuizAttemptId,
                        IsPassed = request.IsPassed,
                        OverallPercentage = request.OverallPercentage,
                        CanEnroll = request.IsPassed,
                        SectionResults = sectionResults.Select(sr => new QuizSectionResultResponseDto
                        {
                            SectionResultId = sr.SectionResultId,
                            SectionName = sr.SectionName,
                            TotalQuestions = sr.TotalQuestions,
                            CorrectAnswers = sr.CorrectAnswers,
                            SectionPercentage = sr.SectionPercentage,
                            SectionPassed = sr.SectionPassed
                        }).ToList()
                    };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error submitting guest quiz for email {Email}", request.Email);
                    return new GuestQuizSubmissionResultDto
                    {
                        Success = false,
                        Message = "An error occurred while submitting the quiz. Please try again."
                    };
                }
            });
        }

        public async Task<QuizSubmissionResultDto> SubmitQuizAsync(SubmitQuizRequestDto request)
        {
            try
            {
                // Verify student exists
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.StudentId == request.StudentId);

                if (student == null)
                {
                    return new QuizSubmissionResultDto
                    {
                        Success = false,
                        Message = "Student not found"
                    };
                }

                // Create quiz attempt
                var quizAttempt = new PreEnrollmentQuizAttempt
                {
                    QuizAttemptId = Guid.NewGuid(),
                    StudentId = request.StudentId,
                    AttemptDate = DateTime.UtcNow,
                    TotalQuestions = request.TotalQuestions,
                    CorrectAnswers = request.CorrectAnswers,
                    OverallPercentage = request.OverallPercentage,
                    IsPassed = request.IsPassed,
                    Status = "Completed",
                    CompletedAt = DateTime.UtcNow
                };

                _context.PreEnrollmentQuizAttempts.Add(quizAttempt);

                // Create section results
                var sectionResults = new List<QuizSectionResult>();
                foreach (var sectionDto in request.SectionResults)
                {
                    var sectionResult = new QuizSectionResult
                    {
                        SectionResultId = Guid.NewGuid(),
                        QuizAttemptId = quizAttempt.QuizAttemptId,
                        SectionName = sectionDto.SectionName,
                        TotalQuestions = sectionDto.TotalQuestions,
                        CorrectAnswers = sectionDto.CorrectAnswers,
                        SectionPercentage = sectionDto.SectionPercentage,
                        SectionPassed = sectionDto.SectionPassed
                    };
                    sectionResults.Add(sectionResult);
                    _context.QuizSectionResults.Add(sectionResult);
                }

                await _context.SaveChangesAsync();

                // When student passes, update all their enrollments that are still pending quiz completion
                if (request.IsPassed)
                {
                    var pendingEnrollments = await _context.Enrollments
                        .Where(e => e.StudentId == request.StudentId && !e.QuizCompleted && e.Status != "Cancelled")
                        .ToListAsync();

                    foreach (var enrollment in pendingEnrollments)
                    {
                        enrollment.QuizAttemptId = quizAttempt.QuizAttemptId;
                        enrollment.QuizCompleted = true;
                    }

                    if (pendingEnrollments.Count > 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation(
                            "Updated {Count} enrollment(s) for student {StudentId} with quiz completion",
                            pendingEnrollments.Count, request.StudentId);
                    }
                }

                _logger.LogInformation(
                    "Quiz submitted successfully for student {StudentId}. Attempt ID: {QuizAttemptId}, Passed: {IsPassed}",
                    request.StudentId, quizAttempt.QuizAttemptId, request.IsPassed);

                return new QuizSubmissionResultDto
                {
                    Success = true,
                    Message = request.IsPassed
                        ? "Congratulations! You have passed the pre-enrollment assessment."
                        : "Assessment completed. An administrator will review your results.",
                    QuizAttemptId = quizAttempt.QuizAttemptId,
                    IsPassed = request.IsPassed,
                    OverallPercentage = request.OverallPercentage,
                    CanEnroll = request.IsPassed,
                    SectionResults = sectionResults.Select(sr => new QuizSectionResultResponseDto
                    {
                        SectionResultId = sr.SectionResultId,
                        SectionName = sr.SectionName,
                        TotalQuestions = sr.TotalQuestions,
                        CorrectAnswers = sr.CorrectAnswers,
                        SectionPercentage = sr.SectionPercentage,
                        SectionPassed = sr.SectionPassed
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting quiz for student {StudentId}", request.StudentId);
                return new QuizSubmissionResultDto
                {
                    Success = false,
                    Message = "An error occurred while submitting the quiz. Please try again."
                };
            }
        }

        public async Task<QuizAttemptResponseDto?> GetQuizAttemptByIdAsync(Guid quizAttemptId)
        {
            var attempt = await _context.PreEnrollmentQuizAttempts
                .Include(qa => qa.Student)
                .Include(qa => qa.QuizSectionResults)
                .Include(qa => qa.AdminBypass)
                .FirstOrDefaultAsync(qa => qa.QuizAttemptId == quizAttemptId);

            if (attempt == null) return null;

            return MapToResponseDto(attempt);
        }

        public async Task<QuizAttemptListResponseDto> GetQuizAttemptsAsync(GetQuizAttemptsRequestDto filter)
        {
            var query = _context.PreEnrollmentQuizAttempts
                .Include(qa => qa.Student)
                .Include(qa => qa.QuizSectionResults)
                .Include(qa => qa.AdminBypass)
                .AsQueryable();

            // Apply filters
            if (filter.StudentId.HasValue)
            {
                query = query.Where(qa => qa.StudentId == filter.StudentId.Value);
            }

            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(qa => qa.Status == filter.Status);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(qa => qa.AttemptDate >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(qa => qa.AttemptDate <= filter.ToDate.Value);
            }

            if (filter.IsPassed.HasValue)
            {
                query = query.Where(qa => qa.IsPassed == filter.IsPassed.Value);
            }

            var totalCount = await query.CountAsync();

            var attempts = await query
                .OrderByDescending(qa => qa.AttemptDate)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new QuizAttemptListResponseDto
            {
                QuizAttempts = attempts.Select(MapToResponseDto).ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<StudentQuizStatusResponseDto> GetStudentQuizStatusAsync(Guid studentId)
        {
            var attempts = await _context.PreEnrollmentQuizAttempts
                .Include(qa => qa.QuizSectionResults)
                .Include(qa => qa.AdminBypass)
                .Include(qa => qa.Student)
                .Where(qa => qa.StudentId == studentId)
                .OrderByDescending(qa => qa.AttemptDate)
                .ToListAsync();

            var latestAttempt = attempts.FirstOrDefault();
            var passedAttempt = attempts.FirstOrDefault(a => a.IsPassed || a.AdminBypass != null);
            var hasAdminBypass = attempts.Any(a => a.AdminBypass != null && a.AdminBypass.IsActive);

            return new StudentQuizStatusResponseDto
            {
                StudentId = studentId,
                HasAttemptedQuiz = attempts.Any(),
                HasPassedQuiz = attempts.Any(a => a.IsPassed),
                HasAdminBypass = hasAdminBypass,
                CanEnroll = attempts.Any(a => a.IsPassed) || hasAdminBypass,
                TotalAttempts = attempts.Count,
                LatestAttempt = latestAttempt != null ? MapToResponseDto(latestAttempt) : null,
                PassedAttempt = passedAttempt != null ? MapToResponseDto(passedAttempt) : null
            };
        }

        public async Task<QuizAttemptResponseDto?> GetLatestQuizAttemptByStudentAsync(Guid studentId)
        {
            var attempt = await _context.PreEnrollmentQuizAttempts
                .Include(qa => qa.Student)
                .Include(qa => qa.QuizSectionResults)
                .Include(qa => qa.AdminBypass)
                .Where(qa => qa.StudentId == studentId)
                .OrderByDescending(qa => qa.AttemptDate)
                .FirstOrDefaultAsync();

            if (attempt == null) return null;

            return MapToResponseDto(attempt);
        }

        public async Task<bool> HasStudentPassedQuizAsync(Guid studentId)
        {
            return await _context.PreEnrollmentQuizAttempts
                .AnyAsync(qa => qa.StudentId == studentId &&
                    (qa.IsPassed || (qa.AdminBypass != null && qa.AdminBypass.IsActive)));
        }

        public async Task<bool> CanStudentEnrollAsync(Guid studentId)
        {
            // Check if student has passed quiz or has admin bypass
            var hasPassedQuiz = await _context.PreEnrollmentQuizAttempts
                .AnyAsync(qa => qa.StudentId == studentId && qa.IsPassed);

            if (hasPassedQuiz) return true;

            // Check for admin bypass
            var hasAdminBypass = await _context.AdminBypasses
                .AnyAsync(ab => ab.StudentId == studentId && ab.IsActive);

            return hasAdminBypass;
        }

        private QuizAttemptResponseDto MapToResponseDto(PreEnrollmentQuizAttempt attempt)
        {
            return new QuizAttemptResponseDto
            {
                QuizAttemptId = attempt.QuizAttemptId,
                StudentId = attempt.StudentId,
                StudentName = attempt.Student?.FullName ?? string.Empty,
                StudentEmail = attempt.Student?.Email ?? string.Empty,
                AttemptDate = attempt.AttemptDate,
                TotalQuestions = attempt.TotalQuestions,
                CorrectAnswers = attempt.CorrectAnswers,
                OverallPercentage = attempt.OverallPercentage,
                IsPassed = attempt.IsPassed,
                Status = attempt.Status,
                CompletedAt = attempt.CompletedAt,
                HasAdminBypass = attempt.AdminBypass != null && attempt.AdminBypass.IsActive,
                SectionResults = attempt.QuizSectionResults.Select(sr => new QuizSectionResultResponseDto
                {
                    SectionResultId = sr.SectionResultId,
                    SectionName = sr.SectionName,
                    TotalQuestions = sr.TotalQuestions,
                    CorrectAnswers = sr.CorrectAnswers,
                    SectionPercentage = sr.SectionPercentage,
                    SectionPassed = sr.SectionPassed
                }).ToList()
            };
        }
    }
}
