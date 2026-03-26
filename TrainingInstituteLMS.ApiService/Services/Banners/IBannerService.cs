using TrainingInstituteLMS.DTOs.DTOs.Requests.Banners;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Banners;

namespace TrainingInstituteLMS.ApiService.Services.Banners
{
    public interface IBannerService
    {
        Task<List<BannerResponseDto>> GetAllAdminAsync();
        Task<List<BannerResponseDto>> GetActivePublicAsync();
        Task<BannerResponseDto?> GetByIdAsync(Guid id);
        Task<BannerResponseDto> CreateAsync(CreateBannerRequestDto request);
        Task<BannerResponseDto?> UpdateAsync(Guid id, UpdateBannerRequestDto request);
        Task<BannerResponseDto?> ToggleAsync(Guid id);
        Task<bool> DeleteAsync(Guid id);
    }
}

