using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseCategory;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CourseCategory;

namespace TrainingInstituteLMS.ApiService.Services.Course.CourseCategory
{
    public interface ICategoryService
    {
        // CRUD operations
        Task<CategoryResponseDto?> CreateCategoryAsync(CreateCategoryRequestDto request, Guid? createdBy = null);
        Task<CategoryResponseDto?> GetCategoryByIdAsync(Guid categoryId);
        Task<CategoryResponseDto?> GetCategoryByNameAsync(string categoryName);
        Task<CategoryResponseDto?> UpdateCategoryAsync(Guid categoryId, UpdateCategoryRequestDto request);
        Task<bool> DeleteCategoryAsync(Guid categoryId);
        Task<bool> ToggleCategoryStatusAsync(Guid categoryId);

        // List operations
        Task<CategoryListResponseDto> GetAllCategoriesAsync(CategoryFilterRequestDto filter);
        Task<CategoryDropdownListDto> GetCategoriesForDropdownAsync();

        // Validation
        Task<bool> CategoryNameExistsAsync(string categoryName, Guid? excludeCategoryId = null);
        Task<bool> CategoryHasCoursesAsync(Guid categoryId);

        // Reorder
        Task<bool> ReorderCategoriesAsync(Guid[] categoryIds);
    }
}
