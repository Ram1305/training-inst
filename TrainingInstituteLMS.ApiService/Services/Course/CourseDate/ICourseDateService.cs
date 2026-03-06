using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseDate;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CourseDate;

namespace TrainingInstituteLMS.ApiService.Services.Course.CourseDate
{
    public interface ICourseDateService
    {
        Task<CourseDateResponseDto> CreateCourseDateAsync(CreateCourseDateRequestDto request, Guid? createdBy = null);
        Task<CourseDateResponseDto?> GetCourseDateByIdAsync(Guid courseDateId);
        Task<CourseDateListResponseDto> GetCourseDatesAsync(CourseDateFilterRequestDto filter);
        Task<List<CourseDateSimpleDto>> GetCourseDatesForCourseAsync(Guid courseId, bool activeOnly = true, DateTime? fromDate = null);
        Task<CourseDateResponseDto?> UpdateCourseDateAsync(Guid courseDateId, UpdateCourseDateRequestDto request);
        /// <summary>
        /// Deletes a course date. If it has enrollments, deactivates instead.
        /// </summary>
        /// <returns>Tuple of (success, wasDeactivated). wasDeactivated is true when deactivated due to enrollments.</returns>
        Task<(bool Success, bool WasDeactivated)> DeleteCourseDateAsync(Guid courseDateId);
        Task<bool> ToggleCourseDateStatusAsync(Guid courseDateId);
        Task<bool> BulkCreateCourseDatesAsync(Guid courseId, List<DateTime> dates, string dateType = "General", Guid? createdBy = null);
        Task<bool> BulkDeleteCourseDatesAsync(Guid courseId, List<Guid> courseDateIds);
    }
}
