using TrainingInstituteLMS.DTOs.DTOs.Requests.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Responses.VOC;

namespace TrainingInstituteLMS.ApiService.Services.VOC
{
    public interface IVOCService
    {
        Task<VOCSubmissionResponseDto?> SubmitVOCAsync(VOCSubmissionRequestDto request);
        Task<VOCListResponseDto> GetAllVOCSubmissionsAsync(int pageNumber, int pageSize, string? searchQuery, string? status);
        Task<VOCSubmissionResponseDto?> GetVOCSubmissionByIdAsync(Guid submissionId);
        Task<VOCSubmissionResponseDto?> UpdateVOCStatusAsync(Guid submissionId, string status);
        Task<bool> DeleteVOCSubmissionAsync(Guid submissionId);
        Task<VOCStatsResponseDto> GetVOCStatsAsync();
    }
}
