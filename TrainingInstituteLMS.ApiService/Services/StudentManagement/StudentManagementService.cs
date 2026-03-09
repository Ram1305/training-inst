using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Student;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Student;

namespace TrainingInstituteLMS.ApiService.Services.StudentManagement
{
    public class StudentManagementService : IStudentManagementService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<StudentManagementService> _logger;

        public StudentManagementService(TrainingLMSDbContext context, ILogger<StudentManagementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<StudentListResponseDto> GetAllStudentsAsync(StudentFilterRequestDto filter)
        {
            try
            {
                var query = _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .AsNoTracking();

                // Apply search filter
                if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
                {
                    var searchLower = filter.SearchQuery.ToLower();
                    query = query.Where(s =>
                        s.FullName.ToLower().Contains(searchLower) ||
                        s.Email.ToLower().Contains(searchLower) ||
                        (s.PreferredName != null && s.PreferredName.ToLower().Contains(searchLower)));
                }

                // Apply status filter
                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    var isActive = filter.Status.ToLower() == "active";
                    query = query.Where(s => s.IsActive == isActive);
                }

                // Apply campus location filter
                if (!string.IsNullOrWhiteSpace(filter.CampusLocation))
                {
                    query = query.Where(s => s.CampusLocation == filter.CampusLocation);
                }

                // Apply employment type filter
                if (!string.IsNullOrWhiteSpace(filter.EmploymentType))
                {
                    query = query.Where(s => s.EmploymentType == filter.EmploymentType);
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var students = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(s => MapToStudentResponse(s))
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                return new StudentListResponseDto
                {
                    Students = students,
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student list");
                throw;
            }
        }

        public async Task<StudentResponseDto?> GetStudentByIdAsync(Guid studentId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                return student == null ? null : MapToStudentResponse(student);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student by ID: {StudentId}", studentId);
                throw;
            }
        }

        public async Task<StudentResponseDto?> GetStudentByUserIdAsync(Guid userId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                return student == null ? null : MapToStudentResponse(student);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student by User ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<StudentResponseDto?> CreateStudentAsync(CreateStudentRequestDto request, Guid? createdBy = null)
        {
            try
            {
                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    _logger.LogWarning("Email already exists: {Email}", request.Email);
                    return null;
                }

                Guid? validCreatedBy = null;

                if (createdBy.HasValue && createdBy.Value != Guid.Empty)
                {
                    var creatorExists = await _context.Users.AnyAsync(u => u.UserId == createdBy.Value);
                    if (creatorExists)
                    {
                        validCreatedBy = createdBy.Value;
                    }
                }

                // If still null, try to get any Admin or SuperAdmin
                if (!validCreatedBy.HasValue)
                {
                    var admin = await _context.Users
                        .Where(u => (u.UserType == "SuperAdmin" || u.UserType == "Admin") && u.IsActive)
                        .Select(u => u.UserId)
                        .FirstOrDefaultAsync();

                    validCreatedBy = admin != Guid.Empty ? admin : (Guid?)null;
                }

                // Create User first
                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    UserType = "Student",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = validCreatedBy,
                    CreatedByRole = "Admin"
                };

                _context.Users.Add(user);

                // Create Student profile
                var student = new Student
                {
                    StudentId = Guid.NewGuid(),
                    UserId = user.UserId,
                    FullName = request.FullName,
                    PreferredName = request.PreferredName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    PassportIdType = request.PassportIdType,
                    DocumentType = request.DocumentType,
                    PassportIdNumber = request.PassportIdNumber,
                    PositionTitle = request.PositionTitle,
                    EmploymentType = request.EmploymentType,
                    StartDate = request.StartDate,
                    CampusLocation = request.CampusLocation,
                    AddressLine1 = request.AddressLine1,
                    AddressLine2 = request.AddressLine2,
                    Suburb = request.Suburb,
                    StateCode = request.StateCode,
                    Postcode = request.Postcode,
                    TeachingQualification = request.TeachingQualification,
                    VocationalQualifications = request.VocationalQualifications,
                    ComplianceExpiryDate = request.ComplianceExpiryDate,
                    PoliceCheckStatus = request.PoliceCheckStatus,
                    RightToWork = request.RightToWork,
                    Permissions = request.Permissions,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Students.Add(student);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Student created successfully: {Email}", request.Email);

                // Reload with navigation properties
                var createdStudent = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.StudentId == student.StudentId);

                return createdStudent == null ? null : MapToStudentResponse(createdStudent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating student: {Email}", request.Email);
                throw;
            }
        }

        public async Task<StudentResponseDto?> UpdateStudentAsync(Guid studentId, UpdateStudentRequestDto request)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                if (student == null)
                {
                    _logger.LogWarning("Student not found: {StudentId}", studentId);
                    return null;
                }

                // Check if email is being changed and if it already exists
                if (student.Email != request.Email)
                {
                    if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != student.UserId))
                    {
                        _logger.LogWarning("Email already exists: {Email}", request.Email);
                        return null;
                    }
                }

                // Update Student fields
                student.FullName = request.FullName;
                student.PreferredName = request.PreferredName;
                student.Email = request.Email;
                student.PhoneNumber = request.PhoneNumber;
                student.PassportIdType = request.PassportIdType;
                student.DocumentType = request.DocumentType;
                student.PassportIdNumber = request.PassportIdNumber;
                student.PositionTitle = request.PositionTitle;
                student.EmploymentType = request.EmploymentType;
                student.StartDate = request.StartDate;
                student.CampusLocation = request.CampusLocation;
                student.AddressLine1 = request.AddressLine1;
                student.AddressLine2 = request.AddressLine2;
                student.Suburb = request.Suburb;
                student.StateCode = request.StateCode;
                student.Postcode = request.Postcode;
                student.TeachingQualification = request.TeachingQualification;
                student.VocationalQualifications = request.VocationalQualifications;
                student.ComplianceExpiryDate = request.ComplianceExpiryDate;
                student.PoliceCheckStatus = request.PoliceCheckStatus;
                student.RightToWork = request.RightToWork;
                student.Permissions = request.Permissions;

                // Update status if provided
                if (request.IsActive.HasValue)
                {
                    student.IsActive = request.IsActive.Value;
                    student.User.IsActive = request.IsActive.Value;
                }

                // Update User fields
                student.User.FullName = request.FullName;
                student.User.Email = request.Email;
                student.User.PhoneNumber = request.PhoneNumber;

                // Update password if provided
                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    student.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Student updated successfully: {StudentId}", studentId);

                // Reload with navigation properties
                var updatedStudent = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                return updatedStudent == null ? null : MapToStudentResponse(updatedStudent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating student: {StudentId}", studentId);
                throw;
            }
        }

        public async Task<bool> DeleteStudentAsync(Guid studentId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.Enrollments)
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                if (student == null)
                {
                    _logger.LogWarning("Student not found for deletion: {StudentId}", studentId);
                    return false;
                }

                // Check if student has any enrollments
                if (student.Enrollments.Any())
                {
                    _logger.LogWarning("Cannot delete student with existing enrollments: {StudentId}", studentId);
                    return false;
                }

                // Get quiz attempts for this student (must delete before student due to FK)
                var quizAttemptIds = await _context.PreEnrollmentQuizAttempts
                    .Where(q => q.StudentId == studentId)
                    .Select(q => q.QuizAttemptId)
                    .ToListAsync();

                if (quizAttemptIds.Count > 0)
                {
                    // Delete AdminBypass records (reference QuizAttempt)
                    var adminBypasses = await _context.AdminBypasses
                        .Where(ab => quizAttemptIds.Contains(ab.QuizAttemptId))
                        .ToListAsync();
                    _context.AdminBypasses.RemoveRange(adminBypasses);

                    // Delete QuizSectionResults (reference QuizAttempt)
                    var sectionResults = await _context.QuizSectionResults
                        .Where(qsr => quizAttemptIds.Contains(qsr.QuizAttemptId))
                        .ToListAsync();
                    _context.QuizSectionResults.RemoveRange(sectionResults);

                    // Delete PreEnrollmentQuizAttempts
                    var quizAttempts = await _context.PreEnrollmentQuizAttempts
                        .Where(q => q.StudentId == studentId)
                        .ToListAsync();
                    _context.PreEnrollmentQuizAttempts.RemoveRange(quizAttempts);
                }

                // Remove UserRoles (User has Restrict/Cascade - ensure clean delete order)
                var userRoles = await _context.UserRoles
                    .Where(ur => ur.UserId == student.UserId)
                    .ToListAsync();
                _context.UserRoles.RemoveRange(userRoles);

                _context.Students.Remove(student);
                _context.Users.Remove(student.User);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Student deleted successfully: {StudentId}", studentId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting student: {StudentId}", studentId);
                throw;
            }
        }

        public async Task<bool> ToggleStudentStatusAsync(Guid studentId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == studentId);

                if (student == null)
                {
                    _logger.LogWarning("Student not found for status toggle: {StudentId}", studentId);
                    return false;
                }

                student.IsActive = !student.IsActive;
                student.User.IsActive = student.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Student status toggled: {StudentId}, New Status: {Status}",
                    studentId, student.IsActive ? "Active" : "Inactive");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling student status: {StudentId}", studentId);
                throw;
            }
        }

        public async Task<StudentStatsResponseDto> GetStudentStatsAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);

                var stats = new StudentStatsResponseDto
                {
                    TotalStudents = await _context.Students.CountAsync(),
                    ActiveStudents = await _context.Students.CountAsync(s => s.IsActive),
                    InactiveStudents = await _context.Students.CountAsync(s => !s.IsActive),
                    NewStudentsThisMonth = await _context.Students.CountAsync(s => s.CreatedAt >= firstDayOfMonth),
                    StudentsWithEnrollments = await _context.Students
                        .Include(s => s.Enrollments)
                        .CountAsync(s => s.Enrollments.Any()),
                    StudentsWithCompletedCourses = await _context.Students
                        .Include(s => s.Enrollments)
                        .CountAsync(s => s.Enrollments.Any(e => e.Status == "Completed"))
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student stats");
                throw;
            }
        }

        private static StudentResponseDto MapToStudentResponse(Student student)
        {
            return new StudentResponseDto
            {
                StudentId = student.StudentId,
                UserId = student.UserId,
                FullName = student.FullName,
                PreferredName = student.PreferredName,
                Email = student.Email,
                PhoneNumber = student.PhoneNumber,
                PassportIdType = student.PassportIdType,
                DocumentType = student.DocumentType,
                PassportIdNumber = student.PassportIdNumber,
                PositionTitle = student.PositionTitle,
                EmploymentType = student.EmploymentType,
                StartDate = student.StartDate,
                CampusLocation = student.CampusLocation,
                AddressLine1 = student.AddressLine1,
                AddressLine2 = student.AddressLine2,
                Suburb = student.Suburb,
                StateCode = student.StateCode,
                Postcode = student.Postcode,
                TeachingQualification = student.TeachingQualification,
                VocationalQualifications = student.VocationalQualifications,
                ComplianceExpiryDate = student.ComplianceExpiryDate,
                PoliceCheckStatus = student.PoliceCheckStatus,
                RightToWork = student.RightToWork,
                Permissions = student.Permissions,
                IsActive = student.IsActive,
                CreatedAt = student.CreatedAt,
                LastLoginAt = student.User?.LastLoginAt,
                EnrollmentCount = student.Enrollments?.Count ?? 0
            };
        }
    }
}
