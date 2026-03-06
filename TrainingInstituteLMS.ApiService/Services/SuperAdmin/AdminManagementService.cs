using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Requests.SuperAdmin;
using TrainingInstituteLMS.DTOs.DTOs.Responses.SuperAdmin;

namespace TrainingInstituteLMS.ApiService.Services.SuperAdmin
{
    public class AdminManagementService : IAdminManagementService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<AdminManagementService> _logger;

        public AdminManagementService(TrainingLMSDbContext context, ILogger<AdminManagementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AdminListResponseDto> GetAllAdminsAsync(AdminFilterRequestDto filter)
        {
            try
            {
                var query = _context.Users
                    .Where(u => u.UserType == "Admin" || u.UserType == "Teacher")
                    .AsNoTracking();

                // Apply search filter
                if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
                {
                    var searchLower = filter.SearchQuery.ToLower();
                    query = query.Where(u =>
                        u.FullName.ToLower().Contains(searchLower) ||
                        u.Email.ToLower().Contains(searchLower));
                }

                // Apply status filter
                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    var isActive = filter.Status.ToLower() == "active";
                    query = query.Where(u => u.IsActive == isActive);
                }

                // Apply user type filter
                if (!string.IsNullOrWhiteSpace(filter.UserType))
                {
                    query = query.Where(u => u.UserType == filter.UserType);
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var admins = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(u => MapToAdminResponse(u))
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                return new AdminListResponseDto
                {
                    Admins = admins,
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin list");
                throw;
            }
        }

        public async Task<AdminResponseDto?> GetAdminByIdAsync(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == userId &&
                        (u.UserType == "Admin" || u.UserType == "Teacher"));

                return user == null ? null : MapToAdminResponse(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin by ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<AdminResponseDto?> CreateAdminAsync(CreateAdminRequestDto request, Guid? createdBy = null)
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

                // If still null, try to get any SuperAdmin
                if (!validCreatedBy.HasValue)
                {
                    var superAdmin = await _context.Users
                        .Where(u => u.UserType == "SuperAdmin" && u.IsActive)
                        .Select(u => u.UserId)
                        .FirstOrDefaultAsync();

                    validCreatedBy = superAdmin != Guid.Empty ? superAdmin : (Guid?)null;
                }

                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    UserType = request.UserType,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = validCreatedBy, // ✅ Will be null if no SuperAdmin exists
                    CreatedByRole = "SuperAdmin"
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin/Teacher created successfully: {Email}", request.Email);

                return MapToAdminResponse(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin/teacher: {Email}", request.Email);
                throw;
            }
        }

        public async Task<AdminResponseDto?> UpdateAdminAsync(Guid userId, UpdateAdminRequestDto request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId &&
                        (u.UserType == "Admin" || u.UserType == "Teacher"));

                if (user == null)
                {
                    _logger.LogWarning("Admin/Teacher not found: {UserId}", userId);
                    return null;
                }

                // Check if email is being changed and if it already exists
                if (user.Email != request.Email)
                {
                    if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != userId))
                    {
                        _logger.LogWarning("Email already exists: {Email}", request.Email);
                        return null;
                    }
                }

                // Update fields
                user.FullName = request.FullName;
                user.Email = request.Email;
                user.PhoneNumber = request.PhoneNumber;

                // Update password if provided
                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                }

                // Update status if provided
                if (request.IsActive.HasValue)
                {
                    user.IsActive = request.IsActive.Value;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin/Teacher updated successfully: {UserId}", userId);

                return MapToAdminResponse(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin/teacher: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeleteAdminAsync(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId &&
                        (u.UserType == "Admin" || u.UserType == "Teacher"));

                if (user == null)
                {
                    _logger.LogWarning("Admin/Teacher not found for deletion: {UserId}", userId);
                    return false;
                }

                // Prevent deletion of SuperAdmin
                if (user.UserType == "SuperAdmin")
                {
                    _logger.LogWarning("Attempted to delete SuperAdmin: {UserId}", userId);
                    return false;
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin/Teacher deleted successfully: {UserId}", userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting admin/teacher: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> ToggleAdminStatusAsync(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId &&
                        (u.UserType == "Admin" || u.UserType == "Teacher"));

                if (user == null)
                {
                    _logger.LogWarning("Admin/Teacher not found for status toggle: {UserId}", userId);
                    return false;
                }

                // Prevent deactivating SuperAdmin
                if (user.UserType == "SuperAdmin")
                {
                    _logger.LogWarning("Attempted to deactivate SuperAdmin: {UserId}", userId);
                    return false;
                }

                user.IsActive = !user.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin/Teacher status toggled: {UserId}, New Status: {Status}",
                    userId, user.IsActive ? "Active" : "Inactive");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling admin/teacher status: {UserId}", userId);
                throw;
            }
        }

        public async Task<AdminStatsResponseDto> GetAdminStatsAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);

                var stats = new AdminStatsResponseDto
                {
                    TotalAdmins = await _context.Users.CountAsync(u => u.UserType == "Admin"),
                    ActiveAdmins = await _context.Users.CountAsync(u => u.UserType == "Admin" && u.IsActive),
                    InactiveAdmins = await _context.Users.CountAsync(u => u.UserType == "Admin" && !u.IsActive),
                    TotalTeachers = await _context.Users.CountAsync(u => u.UserType == "Teacher"),
                    ActiveTeachers = await _context.Users.CountAsync(u => u.UserType == "Teacher" && u.IsActive),
                    TotalUsers = await _context.Users.CountAsync(),
                    NewAdminsThisMonth = await _context.Users.CountAsync(u =>
                        u.UserType == "Admin" && u.CreatedAt >= firstDayOfMonth),
                    NewTeachersThisMonth = await _context.Users.CountAsync(u =>
                        u.UserType == "Teacher" && u.CreatedAt >= firstDayOfMonth)
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin stats");
                throw;
            }
        }

        private static AdminResponseDto MapToAdminResponse(User user)
        {
            return new AdminResponseDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                UserType = user.UserType,
                PhoneNumber = user.PhoneNumber,
                Location = null, 
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                CreatedByRole = user.CreatedByRole ?? "System"
            };
        }
    }
}
