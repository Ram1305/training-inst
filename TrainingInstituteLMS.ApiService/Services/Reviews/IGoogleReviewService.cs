using TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Reviews;

namespace TrainingInstituteLMS.ApiService.Services.Reviews
{
    public interface IGoogleReviewService
    {
        Task<List<GoogleReviewResponseDto>> GetPublicReviewsAsync();
        Task<GoogleReviewListResponseDto> GetAllAsync(GoogleReviewFilterRequestDto filter);
        Task<GoogleReviewResponseDto?> GetByIdAsync(Guid id);
        Task<GoogleReviewResponseDto?> CreateAsync(CreateGoogleReviewRequestDto request, Guid? createdBy = null);
        Task<GoogleReviewResponseDto?> UpdateAsync(Guid id, UpdateGoogleReviewRequestDto request);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ReorderAsync(Guid[] ids);
        Task<bool> ToggleStatusAsync(Guid id);
        Task<GoogleReviewStatsResponseDto> GetStatsAsync();
    }
}
