using TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Gallery;

namespace TrainingInstituteLMS.ApiService.Services.Gallery
{
    public interface IGalleryService
    {
        Task<List<GalleryImageResponseDto>> GetPublicImagesAsync();
        Task<GalleryImageListResponseDto> GetAllAsync(GalleryImageFilterRequestDto filter);
        Task<GalleryImageResponseDto?> GetByIdAsync(Guid id);
        Task<GalleryImageResponseDto?> CreateAsync(CreateGalleryImageRequestDto request, Guid? createdBy = null);
        Task<GalleryImageResponseDto?> UpdateAsync(Guid id, UpdateGalleryImageRequestDto request);
        Task<bool> DeleteAsync(Guid id);
    }
}
