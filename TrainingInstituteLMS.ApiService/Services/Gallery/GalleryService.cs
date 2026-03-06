using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Gallery;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Gallery;

namespace TrainingInstituteLMS.ApiService.Services.Gallery
{
    public class GalleryService : IGalleryService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public GalleryService(TrainingLMSDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        public async Task<List<GalleryImageResponseDto>> GetPublicImagesAsync()
        {
            var entities = await _context.GalleryImages
                .Where(i => i.IsActive)
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.CreatedAt)
                .ToListAsync();

            return entities.Select(i => new GalleryImageResponseDto
            {
                GalleryImageId = i.GalleryImageId,
                ImageUrl = GetImageFullUrl(i.ImageUrl),
                Title = i.Title,
                DisplayOrder = i.DisplayOrder,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToList();
        }

        public async Task<GalleryImageListResponseDto> GetAllAsync(GalleryImageFilterRequestDto filter)
        {
            var query = _context.GalleryImages.AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var searchLower = filter.SearchQuery.ToLower();
                query = query.Where(i => i.Title.ToLower().Contains(searchLower));
            }

            if (filter.IsActive.HasValue)
                query = query.Where(i => i.IsActive == filter.IsActive.Value);

            var totalCount = await query.CountAsync();

            query = filter.SortBy?.ToLower() switch
            {
                "title" => filter.SortDescending
                    ? query.OrderByDescending(i => i.Title)
                    : query.OrderBy(i => i.Title),
                "createdat" => filter.SortDescending
                    ? query.OrderByDescending(i => i.CreatedAt)
                    : query.OrderBy(i => i.CreatedAt),
                _ => filter.SortDescending
                    ? query.OrderByDescending(i => i.DisplayOrder).ThenByDescending(i => i.CreatedAt)
                    : query.OrderBy(i => i.DisplayOrder).ThenBy(i => i.CreatedAt)
            };

            var entities = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var images = entities.Select(i => new GalleryImageResponseDto
            {
                GalleryImageId = i.GalleryImageId,
                ImageUrl = GetImageFullUrl(i.ImageUrl),
                Title = i.Title,
                DisplayOrder = i.DisplayOrder,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            }).ToList();

            return new GalleryImageListResponseDto
            {
                Images = images,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<GalleryImageResponseDto?> GetByIdAsync(Guid id)
        {
            var entity = await _context.GalleryImages.FindAsync(id);
            if (entity == null) return null;
            return MapToResponse(entity);
        }

        public async Task<GalleryImageResponseDto?> CreateAsync(CreateGalleryImageRequestDto request, Guid? createdBy = null)
        {
            var processedImageUrl = await ProcessImageUrlAsync(request.ImageUrl);
            if (string.IsNullOrWhiteSpace(processedImageUrl))
                return null;

            var maxOrder = await _context.GalleryImages
                .MaxAsync(i => (int?)i.DisplayOrder) ?? 0;

            var image = new GalleryImage
            {
                ImageUrl = processedImageUrl,
                Title = request.Title.Trim(),
                DisplayOrder = request.DisplayOrder > 0 ? request.DisplayOrder : maxOrder + 1,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.GalleryImages.Add(image);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(image.GalleryImageId);
        }

        public async Task<GalleryImageResponseDto?> UpdateAsync(Guid id, UpdateGalleryImageRequestDto request)
        {
            var image = await _context.GalleryImages.FindAsync(id);
            if (image == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Title))
                image.Title = request.Title.Trim();

            if (request.IsActive.HasValue)
                image.IsActive = request.IsActive.Value;

            image.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var image = await _context.GalleryImages.FindAsync(id);
            if (image == null) return false;

            // Delete file from storage if it's our stored file
            if (!string.IsNullOrWhiteSpace(image.ImageUrl) && image.ImageUrl.StartsWith("gallery-images/"))
            {
                try
                {
                    await _fileStorageService.DeleteFileAsync(image.ImageUrl);
                }
                catch
                {
                    // Continue with DB deletion even if file delete fails
                }
            }

            _context.GalleryImages.Remove(image);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<string?> ProcessImageUrlAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            if (!imageUrl.StartsWith("data:image/"))
                return ExtractRelativePathFromUrl(imageUrl);

            try
            {
                var commaIndex = imageUrl.IndexOf(',');
                if (commaIndex == -1) return null;

                var metadata = imageUrl.Substring(0, commaIndex);
                var base64Data = imageUrl.Substring(commaIndex + 1);
                var mimeType = metadata.Split(':')[1].Split(';')[0];
                var extension = mimeType switch
                {
                    "image/jpeg" => ".jpg",
                    "image/jpg" => ".jpg",
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    "image/webp" => ".webp",
                    "image/bmp" => ".bmp",
                    _ => ".jpg"
                };

                var imageBytes = Convert.FromBase64String(base64Data);
                var fileName = $"gallery-{Guid.NewGuid():N}{extension}";
                using var stream = new MemoryStream(imageBytes);
                var formFile = new FormFile(stream, 0, imageBytes.Length, "file", fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = mimeType
                };

                var uploadResult = await _fileStorageService.UploadFileAsync(formFile, "gallery-images");
                return uploadResult.Success ? uploadResult.RelativePath : null;
            }
            catch
            {
                return null;
            }
        }

        private string GetImageFullUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl)) return string.Empty;
            if (imageUrl.StartsWith("http://") || imageUrl.StartsWith("https://")) return imageUrl;
            return _fileStorageService.GetFileUrl(imageUrl);
        }

        private static string? ExtractRelativePathFromUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            if (!url.StartsWith("http://") && !url.StartsWith("https://")) return url;
            try
            {
                var uri = new Uri(url);
                var path = uri.AbsolutePath.TrimStart('/');
                var filesIndex = path.IndexOf("files/", StringComparison.OrdinalIgnoreCase);
                if (filesIndex >= 0)
                    return path.Substring(filesIndex + 6);
                return path;
            }
            catch
            {
                return null;
            }
        }

        private GalleryImageResponseDto MapToResponse(GalleryImage i)
        {
            return new GalleryImageResponseDto
            {
                GalleryImageId = i.GalleryImageId,
                ImageUrl = GetImageFullUrl(i.ImageUrl),
                Title = i.Title,
                DisplayOrder = i.DisplayOrder,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            };
        }
    }
}
