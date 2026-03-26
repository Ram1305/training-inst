using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.System;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Banners;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Banners;

namespace TrainingInstituteLMS.ApiService.Services.Banners
{
    public class BannerService : IBannerService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public BannerService(TrainingLMSDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        public async Task<List<BannerResponseDto>> GetAllAdminAsync()
        {
            var entities = await _context.Banners
                .OrderBy(b => b.SortOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToResponse).ToList();
        }

        public async Task<List<BannerResponseDto>> GetActivePublicAsync()
        {
            var entities = await _context.Banners
                .Where(b => b.IsActive)
                .OrderBy(b => b.SortOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync();

            return entities.Select(MapToResponse).ToList();
        }

        public async Task<BannerResponseDto?> GetByIdAsync(Guid id)
        {
            var entity = await _context.Banners.FindAsync(id);
            return entity == null ? null : MapToResponse(entity);
        }

        public async Task<BannerResponseDto> CreateAsync(CreateBannerRequestDto request)
        {
            var nextOrder = request.SortOrder;
            if (nextOrder <= 0)
            {
                var maxOrder = await _context.Banners.MaxAsync(b => (int?)b.SortOrder) ?? 0;
                nextOrder = maxOrder + 1;
            }

            var banner = new Banner
            {
                Title = request.Title.Trim(),
                ImagePath = request.ImagePath.Trim(),
                SortOrder = nextOrder,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            return MapToResponse(banner);
        }

        public async Task<BannerResponseDto?> UpdateAsync(Guid id, UpdateBannerRequestDto request)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Title))
                banner.Title = request.Title.Trim();

            if (!string.IsNullOrWhiteSpace(request.ImagePath))
                banner.ImagePath = request.ImagePath.Trim();

            if (request.SortOrder.HasValue)
                banner.SortOrder = request.SortOrder.Value;

            if (request.IsActive.HasValue)
                banner.IsActive = request.IsActive.Value;

            banner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToResponse(banner);
        }

        public async Task<BannerResponseDto?> ToggleAsync(Guid id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return null;

            banner.IsActive = !banner.IsActive;
            banner.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToResponse(banner);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return false;

            var imagePath = banner.ImagePath;

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(imagePath))
            {
                try
                {
                    await _fileStorageService.DeleteFileAsync(imagePath);
                }
                catch
                {
                    // DB deletion succeeded; do not fail request due to storage deletion errors.
                }
            }

            return true;
        }

        private BannerResponseDto MapToResponse(Banner b)
        {
            return new BannerResponseDto
            {
                BannerId = b.BannerId,
                Title = b.Title,
                ImageUrl = string.IsNullOrWhiteSpace(b.ImagePath) ? string.Empty : _fileStorageService.GetFileUrl(b.ImagePath),
                IsActive = b.IsActive,
                SortOrder = b.SortOrder,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            };
        }
    }
}

