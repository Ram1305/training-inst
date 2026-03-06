using Microsoft.EntityFrameworkCore;
using QRCoder;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment;
using EnrollmentEntity = TrainingInstituteLMS.Data.Entities.Enrollments.Enrollment;
using EnrollmentLinkEntity = TrainingInstituteLMS.Data.Entities.Enrollments.EnrollmentLink;

namespace TrainingInstituteLMS.ApiService.Services.PublicEnrollment
{
    public class PublicEnrollmentService : IPublicEnrollmentService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<PublicEnrollmentService> _logger;
        private readonly IConfiguration _configuration;

        public PublicEnrollmentService(
            TrainingLMSDbContext context,
            ILogger<PublicEnrollmentService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Gets the frontend base URL for enrollment links and QR codes.
        /// Uses FrontendUrl from config when set; otherwise falls back to environment-specific defaults.
        /// </summary>
        private string GetFrontendBaseUrl()
        {
            var configuredUrl = _configuration["FrontendUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
            {
                _logger.LogInformation("Using configured FrontendUrl: {Url}", configuredUrl);
                return configuredUrl.TrimEnd('/');
            }

            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var isDevelopment = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);

            if (isDevelopment)
            {
                _logger.LogInformation("Using localhost for development");
                return "http://localhost:5173";
            }

            // Production fallback when FrontendUrl is not set (e.g. main domain for enrollment links)
            const string ProductionFallbackUrl = "https://safetytrainingacademy.edu.au";
            _logger.LogInformation("Using production fallback URL: {Url}", ProductionFallbackUrl);
            return ProductionFallbackUrl;
        }

        public async Task<List<CourseDropdownItemDto>> GetCoursesForDropdownAsync()
        {
            return await _context.Courses
                .Where(c => c.IsActive)
                .Include(c => c.Category)
                .Select(c => new CourseDropdownItemDto
                {
                    CourseId = c.CourseId,
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    Price = c.Price,
                    Duration = c.Duration,
                    CategoryName = c.Category != null ? c.Category.CategoryName : null
                })
                .OrderBy(c => c.CourseName)
                .ToListAsync();
        }

        public async Task<List<CourseDateDropdownItemDto>> GetCourseDatesAsync(Guid courseId)
        {
            var today = DateTime.UtcNow.Date;
            
            return await _context.CourseDates
                .Where(cd => cd.CourseId == courseId && cd.IsActive && cd.ScheduledDate >= today)
                .Select(cd => new CourseDateDropdownItemDto
                {
                    CourseDateId = cd.CourseDateId,
                    StartDate = cd.ScheduledDate,
                    EndDate = cd.ScheduledDate,
                    Location = cd.Location,
                    AvailableSlots = (cd.MaxCapacity ?? 30) - cd.CurrentEnrollments,
                    MaxCapacity = cd.MaxCapacity ?? 30,
                    IsAvailable = cd.CurrentEnrollments < (cd.MaxCapacity ?? 30)
                })
                .OrderBy(cd => cd.StartDate)
                .ToListAsync();
        }

        public async Task<PublicRegistrationResponseDto> RegisterUserAsync(PublicRegistrationRequestDto request)
        {
            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("An account with this email already exists");
            }

            // Create user
            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);

            // Create student
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

            await _context.Students.AddAsync(student);

            // Assign student role
            var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
            if (studentRole != null)
            {
                await _context.UserRoles.AddAsync(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = studentRole.RoleId,
                    AssignedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return new PublicRegistrationResponseDto
            {
                UserId = user.UserId.ToString(),
                StudentId = student.StudentId.ToString(),
                Email = user.Email,
                FullName = user.FullName,
                Token = "" // Token would be generated by auth service
            };
        }

        public async Task<PublicCourseEnrollmentResponseDto> EnrollInCourseAsync(PublicCourseEnrollmentRequestDto request)
        {
            var student = await _context.Students.FindAsync(request.StudentId);
            if (student == null)
            {
                throw new InvalidOperationException("Student not found");
            }

            var courseDate = await _context.CourseDates
                .Include(cd => cd.Course)
                .FirstOrDefaultAsync(cd => cd.CourseDateId == request.CourseDateId);

            if (courseDate == null)
            {
                throw new InvalidOperationException("Course date not found");
            }

            if (courseDate.CurrentEnrollments >= (courseDate.MaxCapacity ?? 30))
            {
                throw new InvalidOperationException("This course date is fully booked");
            }

            // Create enrollment
            var enrollment = new EnrollmentEntity
            {
                EnrollmentId = Guid.NewGuid(),
                StudentId = request.StudentId,
                CourseId = request.CourseId,
                CourseDateId = request.CourseDateId,
                Status = "Pending",
                PaymentStatus = request.PaymentMethod == "cash" ? "Pending" : "Awaiting",
                EnrolledAt = DateTime.UtcNow
            };

            await _context.Enrollments.AddAsync(enrollment);

            // Update course date enrollment count
            courseDate.CurrentEnrollments++;

            await _context.SaveChangesAsync();

            return new PublicCourseEnrollmentResponseDto
            {
                EnrollmentId = enrollment.EnrollmentId.ToString(),
                CourseId = request.CourseId.ToString(),
                CourseDateId = request.CourseDateId.ToString(),
                Status = enrollment.Status
            };
        }

        public async Task<EnrollmentLinkResponseDto> CreateEnrollmentLinkAsync(CreateEnrollmentLinkRequestDto request, Guid createdBy)
        {
            var uniqueCode = GenerateUniqueCode();
            var baseUrl = GetFrontendBaseUrl();
            var fullUrl = $"{baseUrl}/enroll/{uniqueCode}";

            var link = new EnrollmentLinkEntity
            {
                LinkId = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                UniqueCode = uniqueCode,
                CourseId = request.CourseId,
                CourseDateId = request.CourseDateId,
                ExpiresAt = request.ExpiresAt,
                MaxUses = request.MaxUses,
                QrCodeData = GenerateQRCode(fullUrl),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            await _context.EnrollmentLinks.AddAsync(link);
            await _context.SaveChangesAsync();

            return await MapToResponseDto(link);
        }

        public async Task<EnrollmentLinkListResponseDto> GetEnrollmentLinksAsync(int page, int pageSize)
        {
            var query = _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .OrderByDescending(l => l.CreatedAt);

            var totalCount = await query.CountAsync();
            var links = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var linkDtos = new List<EnrollmentLinkResponseDto>();
            foreach (var link in links)
            {
                linkDtos.Add(await MapToResponseDto(link));
            }

            return new EnrollmentLinkListResponseDto
            {
                Links = linkDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<EnrollmentLinkResponseDto?> GetEnrollmentLinkAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .FirstOrDefaultAsync(l => l.LinkId == linkId);

            return link != null ? await MapToResponseDto(link) : null;
        }

        public async Task<EnrollmentLinkDataDto?> GetEnrollmentLinkByCodeAsync(string code)
        {
            var link = await _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .FirstOrDefaultAsync(l => l.UniqueCode == code && l.IsActive);

            if (link == null) return null;

            // Check expiration
            if (link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
            {
                return null;
            }

            // Check max uses
            if (link.MaxUses.HasValue && link.UsedCount >= link.MaxUses.Value)
            {
                return null;
            }

            return new EnrollmentLinkDataDto
            {
                LinkId = link.LinkId.ToString(),
                CourseId = link.CourseId?.ToString(),
                CourseName = link.Course?.CourseName,
                CourseDateId = link.CourseDateId?.ToString(),
                CourseDateRange = link.CourseDate != null 
                    ? $"{link.CourseDate.ScheduledDate:dd/MM/yyyy}"
                    : null
            };
        }

        public async Task<bool> ToggleLinkStatusAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return false;

            link.IsActive = !link.IsActive;
            link.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEnrollmentLinkAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return false;

            _context.EnrollmentLinks.Remove(link);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> RegenerateQRCodeAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return null;

            var baseUrl = GetFrontendBaseUrl();
            var fullUrl = $"{baseUrl}/enroll/{link.UniqueCode}";

            link.QrCodeData = GenerateQRCode(fullUrl);
            link.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return link.QrCodeData;
        }

        private Task<EnrollmentLinkResponseDto> MapToResponseDto(EnrollmentLinkEntity link)
        {
            var baseUrl = GetFrontendBaseUrl();

            return Task.FromResult(new EnrollmentLinkResponseDto
            {
                LinkId = link.LinkId.ToString(),
                Name = link.Name,
                Description = link.Description,
                CourseId = link.CourseId?.ToString(),
                CourseName = link.Course?.CourseName,
                CourseDateId = link.CourseDateId?.ToString(),
                CourseDateRange = link.CourseDate != null
                    ? $"{link.CourseDate.ScheduledDate:dd/MM/yyyy}"
                    : null,
                UniqueCode = link.UniqueCode,
                FullUrl = $"{baseUrl}/enroll/{link.UniqueCode}",
                QrCodeDataUrl = link.QrCodeData ?? "",
                CreatedAt = link.CreatedAt,
                ExpiresAt = link.ExpiresAt,
                MaxUses = link.MaxUses,
                UsedCount = link.UsedCount,
                IsActive = link.IsActive
            });
        }

        private string GenerateUniqueCode()
        {
            var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            var code = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
            return code;
        }

        private string GenerateQRCode(string url)
        {
            try
            {
                using var qrGenerator = new QRCodeGenerator();
                using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new PngByteQRCode(qrCodeData);
                var qrCodeBytes = qrCode.GetGraphic(10);
                return $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code");
                return "";
            }
        }
    }
}
