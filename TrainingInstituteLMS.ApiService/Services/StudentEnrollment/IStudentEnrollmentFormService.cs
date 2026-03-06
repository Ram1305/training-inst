using Microsoft.AspNetCore.Http;
using TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment;

namespace TrainingInstituteLMS.ApiService.Services.StudentEnrollment
{
    public interface IStudentEnrollmentFormService
    {
        // Public operations (guest user - creates account and submits form)
        Task<PublicEnrollmentFormResponseDto> SubmitPublicEnrollmentFormAsync(SubmitPublicEnrollmentFormRequestDto request);

        // Student operations
        Task<EnrollmentFormResponseDto?> GetEnrollmentFormAsync(Guid studentId);
        Task<EnrollmentFormResponseDto?> SubmitEnrollmentFormAsync(Guid studentId, SubmitEnrollmentFormRequestDto request);
        Task<EnrollmentFormResponseDto?> UpdateEnrollmentFormAsync(Guid studentId, SubmitEnrollmentFormRequestDto request);
        Task<string?> UploadDocumentAsync(Guid studentId, IFormFile file, string documentType);

        // Admin operations
        Task<EnrollmentFormListResponseDto> GetEnrollmentFormsForAdminAsync(EnrollmentFormFilterRequestDto filter);
        Task<EnrollmentFormResponseDto?> GetEnrollmentFormByIdForAdminAsync(Guid studentId);
        Task<bool> ReviewEnrollmentFormAsync(Guid studentId, ReviewEnrollmentFormRequestDto request, Guid reviewedBy);
        Task<EnrollmentFormResponseDto?> UpdateEnrollmentFormByAdminAsync(Guid studentId, SubmitEnrollmentFormRequestDto request, Guid updatedBy);
        Task<EnrollmentFormStatsResponseDto> GetEnrollmentFormStatsAsync();
    }
}
