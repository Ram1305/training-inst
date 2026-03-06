using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseCategory;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CourseCategory;
using CourseCategoryEntity = TrainingInstituteLMS.Data.Entities.Courses.CourseCategory;

namespace TrainingInstituteLMS.ApiService.Services.Course.CourseCategory
{
    public class CategoryService : ICategoryService
    {
        private readonly TrainingLMSDbContext _context;

        public CategoryService(TrainingLMSDbContext context)
        {
            _context = context;
        }

        public async Task<CategoryResponseDto?> CreateCategoryAsync(CreateCategoryRequestDto request, Guid? createdBy = null)
        {
            // Check if category name already exists
            if (await CategoryNameExistsAsync(request.CategoryName))
            {
                return null;
            }

            // Get the max display order
            var maxOrder = await _context.CourseCategories
                .MaxAsync(c => (int?)c.DisplayOrder) ?? 0;

            var category = new CourseCategoryEntity
            {
                CategoryName = request.CategoryName.Trim(),
                Description = request.Description?.Trim(),
                IconUrl = request.IconUrl?.Trim(),
                DisplayOrder = request.DisplayOrder ?? maxOrder + 1,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.CourseCategories.Add(category);
            await _context.SaveChangesAsync();

            return await GetCategoryByIdAsync(category.CategoryId);
        }

        public async Task<CategoryResponseDto?> GetCategoryByIdAsync(Guid categoryId)
        {
            var category = await _context.CourseCategories
                .Include(c => c.Courses)
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId);

            if (category == null) return null;

            return MapToCategoryResponseDto(category);
        }

        public async Task<CategoryResponseDto?> GetCategoryByNameAsync(string categoryName)
        {
            var category = await _context.CourseCategories
                .Include(c => c.Courses)
                .FirstOrDefaultAsync(c => c.CategoryName.ToLower() == categoryName.ToLower());

            if (category == null) return null;

            return MapToCategoryResponseDto(category);
        }

        public async Task<CategoryResponseDto?> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequestDto request)
        {
            var category = await _context.CourseCategories.FindAsync(categoryId);
            if (category == null) return null;

            // Check for duplicate name
            if (!string.IsNullOrWhiteSpace(request.CategoryName) &&
                request.CategoryName.Trim().ToLower() != category.CategoryName.ToLower() &&
                await CategoryNameExistsAsync(request.CategoryName, categoryId))
            {
                return null;
            }

            // Update properties
            if (!string.IsNullOrWhiteSpace(request.CategoryName))
                category.CategoryName = request.CategoryName.Trim();
            if (request.Description != null)
                category.Description = request.Description.Trim();
            if (request.IconUrl != null)
                category.IconUrl = request.IconUrl.Trim();
            if (request.DisplayOrder.HasValue)
                category.DisplayOrder = request.DisplayOrder.Value;
            if (request.IsActive.HasValue)
                category.IsActive = request.IsActive.Value;

            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetCategoryByIdAsync(categoryId);
        }

        public async Task<bool> DeleteCategoryAsync(Guid categoryId)
        {
            var category = await _context.CourseCategories
                .Include(c => c.Courses)
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId);

            if (category == null) return false;

            // If category has courses, just deactivate it
            if (category.Courses.Any())
            {
                category.IsActive = false;
                category.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Hard delete if no courses
                _context.CourseCategories.Remove(category);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleCategoryStatusAsync(Guid categoryId)
        {
            var category = await _context.CourseCategories.FindAsync(categoryId);
            if (category == null) return false;

            category.IsActive = !category.IsActive;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CategoryListResponseDto> GetAllCategoriesAsync(CategoryFilterRequestDto filter)
        {
            var query = _context.CourseCategories
                .Include(c => c.Courses)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var searchLower = filter.SearchQuery.ToLower();
                query = query.Where(c =>
                    c.CategoryName.ToLower().Contains(searchLower) ||
                    (c.Description != null && c.Description.ToLower().Contains(searchLower)));
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == filter.IsActive.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy.ToLower() switch
            {
                "name" or "categoryname" => filter.SortDescending
                    ? query.OrderByDescending(c => c.CategoryName)
                    : query.OrderBy(c => c.CategoryName),
                "createdat" => filter.SortDescending
                    ? query.OrderByDescending(c => c.CreatedAt)
                    : query.OrderBy(c => c.CreatedAt),
                "coursecount" => filter.SortDescending
                    ? query.OrderByDescending(c => c.Courses.Count)
                    : query.OrderBy(c => c.Courses.Count),
                _ => filter.SortDescending
                    ? query.OrderByDescending(c => c.DisplayOrder)
                    : query.OrderBy(c => c.DisplayOrder)
            };

            // Apply pagination
            var categories = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new CategoryListResponseDto
            {
                Categories = categories.Select(MapToCategoryResponseDto).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<CategoryDropdownListDto> GetCategoriesForDropdownAsync()
        {
            var categories = await _context.CourseCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CategoryDropdownDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName
                })
                .ToListAsync();

            return new CategoryDropdownListDto { Categories = categories };
        }

        public async Task<bool> CategoryNameExistsAsync(string categoryName, Guid? excludeCategoryId = null)
        {
            var query = _context.CourseCategories
                .Where(c => c.CategoryName.ToLower() == categoryName.Trim().ToLower());

            if (excludeCategoryId.HasValue)
            {
                query = query.Where(c => c.CategoryId != excludeCategoryId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> CategoryHasCoursesAsync(Guid categoryId)
        {
            return await _context.Courses.AnyAsync(c => c.CategoryId == categoryId);
        }

        public async Task<bool> ReorderCategoriesAsync(Guid[] categoryIds)
        {
            var categories = await _context.CourseCategories
                .Where(c => categoryIds.Contains(c.CategoryId))
                .ToListAsync();

            if (categories.Count != categoryIds.Length)
                return false;

            for (int i = 0; i < categoryIds.Length; i++)
            {
                var category = categories.First(c => c.CategoryId == categoryIds[i]);
                category.DisplayOrder = i + 1;
                category.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private static CategoryResponseDto MapToCategoryResponseDto(CourseCategoryEntity category)
        {
            return new CategoryResponseDto
            {
                CategoryId = category.CategoryId,
                CategoryName = category.CategoryName,
                Description = category.Description,
                IconUrl = category.IconUrl,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                CourseCount = category.Courses?.Count(c => c.IsActive) ?? 0,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt
            };
        }
    }
}
