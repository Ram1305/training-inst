using Microsoft.EntityFrameworkCore;
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

        public CompanyManagementService(TrainingLMSDbContext context, ILogger<CompanyManagementService> logger)
        {
            _context = context;
            _logger = logger;
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
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(c => MapToCompanyResponse(c))
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                return new CompanyListResponseDto
                {
                    Companies = companies,
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

                return company == null ? null : MapToCompanyResponse(company);
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

                return company == null ? null : MapToCompanyResponse(company);
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
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Company created successfully: {Email}", request.Email);

                var createdCompany = await _context.Companies
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CompanyId == company.CompanyId);

                return createdCompany == null ? null : MapToCompanyResponse(createdCompany);
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

                return updatedCompany == null ? null : MapToCompanyResponse(updatedCompany);
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

        private static CompanyResponseDto MapToCompanyResponse(Company company)
        {
            return new CompanyResponseDto
            {
                CompanyId = company.CompanyId,
                UserId = company.UserId,
                CompanyName = company.CompanyName,
                Email = company.User?.Email ?? string.Empty,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                LastLoginAt = company.User?.LastLoginAt
            };
        }
    }
}
