using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.PublicEnrollment;
using TrainingInstituteLMS.ApiService.Services.SiteSettings;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Companies;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Auth;

namespace TrainingInstituteLMS.ApiService.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<AuthService> _logger;
        private readonly IPublicEnrollmentService _publicEnrollmentService;
        private readonly IEmailService _emailService;
        private readonly ISiteSettingsService _siteSettingsService;

        public AuthService(
            TrainingLMSDbContext context,
            ILogger<AuthService> logger,
            IPublicEnrollmentService publicEnrollmentService,
            IEmailService emailService,
            ISiteSettingsService siteSettingsService)
        {
            _context = context;
            _logger = logger;
            _publicEnrollmentService = publicEnrollmentService;
            _emailService = emailService;
            _siteSettingsService = siteSettingsService;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await _context.Users
                .Include(u => u.Student)
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null)
            {
                return null;
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToAuthResponse(user);
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto request)
        {
            if (await EmailExistsAsync(request.Email))
            {
                return null;
            }

            var isCompany = string.Equals(request.AccountType, "Company", StringComparison.OrdinalIgnoreCase);
            var fullName = isCompany ? (request.CompanyName ?? request.FullName) : request.FullName;

            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = fullName,
                Email = request.Email,
                PhoneNumber = isCompany ? null : request.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = isCompany ? "Company" : "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = null,
                CreatedByRole = null
            };

            _context.Users.Add(user);

            Student? student = null;
            Company? company = null;

            if (isCompany)
            {
                company = new Company
                {
                    CompanyId = Guid.NewGuid(),
                    UserId = user.UserId,
                    CompanyName = request.CompanyName ?? fullName,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Companies.Add(company);
            }
            else
            {
                student = new Student
                {
                    StudentId = Guid.NewGuid(),
                    UserId = user.UserId,
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Students.Add(student);
            }

            var entityType = isCompany ? "Company" : "Student";
            var entityId = isCompany ? company!.CompanyId : student!.StudentId;
            _logger.LogInformation("AuthRegister: Persisting UserId={UserId}, {EntityType}Id={EntityId}, Email={Email}", user.UserId, entityType, entityId, user.Email);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("AuthRegister: Persisted successfully. {EntityType}Id={EntityId}", entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AuthRegister: SaveChangesAsync failed. UserId={UserId}, {EntityType}Id={EntityId}", user.UserId, entityType, entityId);
                throw;
            }

            user.Student = student;
            user.Company = company;

            if (isCompany && company != null)
            {
                try
                {
                    await _publicEnrollmentService.EnsureCompanyPortalEnrollmentLinkAsync(company.CompanyId);
                    var portalUrl = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(company.CompanyId);
                    var siteBase = await _siteSettingsService.GetEnrollmentBaseUrlAsync();
                    await _emailService.SendCompanyPortalWelcomeAsync(
                        user.Email,
                        company.CompanyName,
                        portalUrl ?? string.Empty,
                        siteBase);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AuthRegister: portal link or welcome email failed for company {CompanyId}", company.CompanyId);
                }
            }

            return MapToAuthResponse(user);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<AuthResponseDto?> GetUserByIdAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.Student)
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);

            return user == null ? null : MapToAuthResponse(user);
        }

        private static AuthResponseDto MapToAuthResponse(User user)
        {
            return new AuthResponseDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                UserType = user.UserType,
                PhoneNumber = user.PhoneNumber,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive,
                StudentId = user.Student?.StudentId,
                CompanyId = user.Company?.CompanyId
            };
        }
    }
}
