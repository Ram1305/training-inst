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
        Task<EnrollmentLinkListResponseDto> GetEnrollmentLinksAsync(int page, int pageSize, string? linkType = null);
        Task<EnrollmentLinkResponseDto?> GetEnrollmentLinkAsync(Guid linkId);
        Task<EnrollmentLinkDataDto?> GetEnrollmentLinkByCodeAsync(string code);
        Task<bool> ToggleLinkStatusAsync(Guid linkId);
        Task<bool> DeleteEnrollmentLinkAsync(Guid linkId);
        Task<string?> RegenerateQRCodeAsync(Guid linkId);

        // Company order (multi-course, one-time links)
        Task<CompanyOrderResponseDto> CreateCompanyOrderAsync(CompanyOrderRequestDto request);
        Task<CompanyCardPaymentResponseDto> ProcessCompanyCardPaymentAsync(CompanyCardPaymentRequestDto request);

        // Admin: company orders (list, detail, update status, count)
        Task<AdminCompanyOrderListResponseDto> GetAdminCompanyOrdersAsync(int page, int pageSize, string? status, string? search);
        Task<AdminCompanyOrderDetailDto?> GetAdminCompanyOrderByIdAsync(Guid orderId);
        Task<bool> UpdateCompanyOrderStatusAsync(Guid orderId, string status);
        Task<int> GetCompanyOrderCountAsync();

        // One-time link: complete enrollment with name/email/phone/password only
        Task<OneTimeLinkCompleteResponseDto> CompleteEnrollmentViaLinkAsync(string code, OneTimeLinkCompleteRequestDto request);

        // Admin: students who joined via a specific enrollment link
        Task<EnrollmentLinkStudentsResponseDto?> GetStudentsByLinkIdAsync(Guid linkId);

        /// <summary>Creates the permanent portal enrollment link for a company if missing; returns the unique code.</summary>
        Task<string> EnsureCompanyPortalEnrollmentLinkAsync(Guid companyId);

        /// <summary>Full public URL for the company portal enrollment link.</summary>
        Task<string?> GetCompanyPortalEnrollmentFullUrlAsync(Guid companyId);

        Task<PortalPrerequisitesResponseDto?> GetPortalPrerequisitesAsync(string code, string email);
    }
}
