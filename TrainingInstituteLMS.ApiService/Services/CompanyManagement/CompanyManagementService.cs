using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.CompanyBilling;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.PublicEnrollment;
using TrainingInstituteLMS.ApiService.Services.SiteSettings;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Companies;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Company;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Company;

namespace TrainingInstituteLMS.ApiService.Services.CompanyManagement
{
    public class CompanyManagementService : ICompanyManagementService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<CompanyManagementService> _logger;
        private readonly IPublicEnrollmentService _publicEnrollmentService;
        private readonly IEmailService _emailService;
        private readonly ISiteSettingsService _siteSettingsService;
        private readonly ICompanyBillingService _companyBillingService;

        public CompanyManagementService(
            TrainingLMSDbContext context,
            ILogger<CompanyManagementService> logger,
            IPublicEnrollmentService publicEnrollmentService,
            IEmailService emailService,
            ISiteSettingsService siteSettingsService,
            ICompanyBillingService companyBillingService)
        {
            _context = context;
            _logger = logger;
            _publicEnrollmentService = publicEnrollmentService;
            _emailService = emailService;
            _siteSettingsService = siteSettingsService;
            _companyBillingService = companyBillingService;
        }

        public async Task<CompanyListResponseDto> GetAllCompaniesAsync(CompanyFilterRequestDto filter)
        {
            try
            {
                var query = _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking();

                if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
                {
                    var searchLower = filter.SearchQuery.ToLower();
                    query = query.Where(c =>
                        c.CompanyName.ToLower().Contains(searchLower) ||
                        c.User.Email.ToLower().Contains(searchLower));
                }

                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    var isActive = filter.Status.ToLower() == "active";
                    query = query.Where(c => c.IsActive == isActive);
                }

                var totalCount = await query.CountAsync();

                var companies = await query
                    .Include(c => c.User)
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                var companyDtos = companies.Select(c => MapToCompanyResponse(c, null)).ToList();

                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                return new CompanyListResponseDto
                {
                    Companies = companyDtos,
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving company list");
                throw;
            }
        }

        public async Task<CompanyResponseDto?> GetCompanyByIdAsync(Guid companyId)
        {
            try
            {
                var company = await _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CompanyId == companyId);

                if (company == null) return null;
                var portalUrl = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(company.CompanyId);
                return MapToCompanyResponse(company, portalUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving company by ID: {CompanyId}", companyId);
                throw;
            }
        }

        public async Task<CompanyResponseDto?> GetCompanyByUserIdAsync(Guid userId)
        {
            try
            {
                var company = await _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (company == null) return null;
                var portalUrl = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(company.CompanyId);
                return MapToCompanyResponse(company, portalUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving company by User ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<CompanyResponseDto?> CreateCompanyAsync(CreateCompanyRequestDto request, Guid? createdBy = null)
        {
            try
            {
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
                        validCreatedBy = createdBy.Value;
                }

                if (!validCreatedBy.HasValue)
                {
                    var admin = await _context.Users
                        .Where(u => (u.UserType == "SuperAdmin" || u.UserType == "Admin") && u.IsActive)
                        .Select(u => u.UserId)
                        .FirstOrDefaultAsync();
                    validCreatedBy = admin != Guid.Empty ? admin : null;
                }

                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    FullName = request.CompanyName,
                    Email = request.Email,
                    PhoneNumber = null,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    UserType = "Company",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = validCreatedBy,
                    CreatedByRole = "Admin"
                };

                _context.Users.Add(user);

                var company = new Company
                {
                    CompanyId = Guid.NewGuid(),
                    UserId = user.UserId,
                    CompanyName = request.CompanyName,
                    MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim(),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Company created successfully: {Email}", request.Email);

                try
                {
                    await _publicEnrollmentService.EnsureCompanyPortalEnrollmentLinkAsync(company.CompanyId);
                    var portalUrl = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(company.CompanyId);
                    var siteBase = await _siteSettingsService.GetEnrollmentBaseUrlAsync();
                    await _emailService.SendCompanyPortalWelcomeAsync(
                        request.Email.Trim(),
                        company.CompanyName,
                        portalUrl ?? string.Empty,
                        siteBase);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Company create: portal link or welcome email failed for {CompanyId}", company.CompanyId);
                }

                var createdCompany = await _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CompanyId == company.CompanyId);

                if (createdCompany == null) return null;
                var url = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(createdCompany.CompanyId);
                return MapToCompanyResponse(createdCompany, url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating company: {Email}", request.Email);
                throw;
            }
        }

        public async Task<CompanyResponseDto?> UpdateCompanyAsync(Guid companyId, UpdateCompanyRequestDto request)
        {
            try
            {
                var company = await _context.Companies
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.CompanyId == companyId);

                if (company == null)
                {
                    _logger.LogWarning("Company not found: {CompanyId}", companyId);
                    return null;
                }

                if (company.User.Email != request.Email &&
                    await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != company.UserId))
                {
                    _logger.LogWarning("Email already exists: {Email}", request.Email);
                    return null;
                }

                company.CompanyName = request.CompanyName;
                company.User.FullName = request.CompanyName;
                company.User.Email = request.Email;
                company.MobileNumber = string.IsNullOrWhiteSpace(request.MobileNumber) ? null : request.MobileNumber.Trim();

                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    company.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Company updated successfully: {CompanyId}", companyId);

                var updatedCompany = await _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CompanyId == companyId);

                if (updatedCompany == null) return null;
                var portalAfterUpdate = await _publicEnrollmentService.GetCompanyPortalEnrollmentFullUrlAsync(updatedCompany.CompanyId);
                return MapToCompanyResponse(updatedCompany, portalAfterUpdate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating company: {CompanyId}", companyId);
                throw;
            }
        }

        public async Task<bool> DeleteCompanyAsync(Guid companyId)
        {
            try
            {
                var company = await _context.Companies
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.CompanyId == companyId);

                if (company == null)
                {
                    _logger.LogWarning("Company not found for deletion: {CompanyId}", companyId);
                    return false;
                }

                _context.Companies.Remove(company);
                _context.Users.Remove(company.User);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Company deleted successfully: {CompanyId}", companyId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting company: {CompanyId}", companyId);
                throw;
            }
        }

        public async Task<CompanyPortalEnrollmentsResponseDto> GetCompanyPortalEnrollmentsAsync(Guid companyId)
        {
            await _companyBillingService.BackfillUnpaidCompanyBillsForCompanyAsync(companyId);

            var enrollments = await _context.Enrollments
                .AsNoTracking()
                .Include(e => e.Student)
                .Include(e => e.Course)
                .Include(e => e.EnrollmentLink!)
                    .ThenInclude(l => l.CompanyOrder)
                .Where(e =>
                    e.EnrollmentType == "Company" &&
                    e.EnrollmentLink != null &&
                    (
                        e.EnrollmentLink.CompanyId == companyId ||
                        (e.EnrollmentLink.CompanyOrderId != null &&
                         e.EnrollmentLink.CompanyOrder != null &&
                         e.EnrollmentLink.CompanyOrder.CompanyId == companyId)
                    ))
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            var enrollmentIds = enrollments.Select(e => e.EnrollmentId).ToList();
            var billRows = await _context.CompanyBillingLines
                .AsNoTracking()
                .Where(l => enrollmentIds.Contains(l.EnrollmentId))
                .Join(
                    _context.CompanyBillingStatements.AsNoTracking(),
                    l => l.StatementId,
                    s => s.StatementId,
                    (l, s) => new { l.EnrollmentId, s.Status })
                .ToListAsync();

            var billByEnrollment = billRows
                .GroupBy(x => x.EnrollmentId)
                .ToDictionary(g => g.Key, g => g.First().Status);

            var items = enrollments.Select(e => new CompanyPortalEnrollmentRowDto
            {
                EnrollmentId = e.EnrollmentId.ToString(),
                StudentName = e.Student?.FullName ?? string.Empty,
                StudentEmail = e.Student?.Email,
                StudentPhone = e.Student?.PhoneNumber ?? e.Student?.Mobile,
                CourseName = e.Course?.CourseName ?? string.Empty,
                CourseId = e.CourseId.ToString(),
                EnrolledAt = e.EnrolledAt,
                CompletedAt = e.CompletedAt,
                Status = e.Status,
                PaymentStatus = e.PaymentStatus,
                AmountPaid = e.AmountPaid,
                LlnAssessmentCompleted = e.QuizCompleted,
                EnrollmentFormCompleted = e.Student?.EnrollmentFormCompleted ?? false,
                HasCompanyBill = billByEnrollment.ContainsKey(e.EnrollmentId),
                CompanyBillStatus = billByEnrollment.TryGetValue(e.EnrollmentId, out var st) ? st : null
            }).ToList();

            return new CompanyPortalEnrollmentsResponseDto { Items = items };
        }

        public async Task<bool> ToggleCompanyStatusAsync(Guid companyId)
        {
            try
            {
                var company = await _context.Companies
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.CompanyId == companyId);

                if (company == null)
                {
                    _logger.LogWarning("Company not found for status toggle: {CompanyId}", companyId);
                    return false;
                }

                company.IsActive = !company.IsActive;
                company.User.IsActive = company.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Company status toggled: {CompanyId}, New Status: {Status}",
                    companyId, company.IsActive ? "Active" : "Inactive");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling company status: {CompanyId}", companyId);
                throw;
            }
        }

        private static CompanyResponseDto MapToCompanyResponse(Company company, string? portalEnrollmentUrl = null)
        {
            return new CompanyResponseDto
            {
                CompanyId = company.CompanyId,
                UserId = company.UserId,
                CompanyName = company.CompanyName,
                Email = company.User?.Email ?? string.Empty,
                MobileNumber = company.MobileNumber,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                LastLoginAt = company.User?.LastLoginAt,
                PortalEnrollmentUrl = portalEnrollmentUrl
            };
        }
    }
}
