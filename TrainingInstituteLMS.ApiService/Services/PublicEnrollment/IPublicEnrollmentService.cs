using TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment;

namespace TrainingInstituteLMS.ApiService.Services.PublicEnrollment
{
    public interface IPublicEnrollmentService
    {
        // Course/Date dropdowns
        Task<List<CourseDropdownItemDto>> GetCoursesForDropdownAsync();
        Task<List<CourseDateDropdownItemDto>> GetCourseDatesAsync(Guid courseId);
        
        // Registration
        Task<PublicRegistrationResponseDto> RegisterUserAsync(PublicRegistrationRequestDto request);
        
        // Course Enrollment
        Task<PublicCourseEnrollmentResponseDto> EnrollInCourseAsync(PublicCourseEnrollmentRequestDto request);
        
        // Enrollment Links (Admin)
        Task<EnrollmentLinkResponseDto> CreateEnrollmentLinkAsync(CreateEnrollmentLinkRequestDto request, Guid createdBy);
        Task<EnrollmentLinkListResponseDto> GetEnrollmentLinksAsync(int page, int pageSize);
        Task<EnrollmentLinkResponseDto?> GetEnrollmentLinkAsync(Guid linkId);
        Task<EnrollmentLinkDataDto?> GetEnrollmentLinkByCodeAsync(string code);
        Task<bool> ToggleLinkStatusAsync(Guid linkId);
        Task<bool> DeleteEnrollmentLinkAsync(Guid linkId);
        Task<string?> RegenerateQRCodeAsync(Guid linkId);
    }
}
