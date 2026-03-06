using TrainingInstituteLMS.DTOs.DTOs.Requests.Course;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Course;

namespace TrainingInstituteLMS.ApiService.Services.Course
{
    public interface ICourseService
    {
        // Course CRUD operations
        Task<CourseResponseDto?> CreateCourseAsync(CreateCourseRequestDto request, Guid? createdBy = null);
        Task<CourseResponseDto?> GetCourseByIdAsync(Guid courseId);
        Task<CourseResponseDto?> GetCourseByCodeAsync(string courseCode);
        Task<CourseResponseDto?> UpdateCourseAsync(Guid courseId, UpdateCourseRequestDto request);
        Task<bool> DeleteCourseAsync(Guid courseId);
        Task<bool> ToggleCourseStatusAsync(Guid courseId);

        // Course listing and filtering
        Task<CourseListResponseDto> GetAllCoursesAsync(CourseFilterRequestDto filter);
        Task<CourseListResponseDto> GetActiveCoursesAsync(CourseFilterRequestDto filter);
        Task<List<CourseListItemDto>> GetFeaturedCoursesAsync(int count = 6);

        // Statistics
        Task<CourseStatsResponseDto> GetCourseStatsAsync();

        // Validation
        Task<bool> CourseCodeExistsAsync(string courseCode, Guid? excludeCourseId = null);

        // Reorder courses within a category (for landing page display)
        Task<bool> ReorderCoursesAsync(Guid categoryId, Guid[] courseIds);
    }
}
