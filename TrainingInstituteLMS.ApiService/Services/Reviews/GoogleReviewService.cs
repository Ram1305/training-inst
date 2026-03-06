using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Reviews;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Reviews;

namespace TrainingInstituteLMS.ApiService.Services.Reviews
{
    public class GoogleReviewService : IGoogleReviewService
    {
        private readonly TrainingLMSDbContext _context;

        public GoogleReviewService(TrainingLMSDbContext context)
        {
            _context = context;
        }

        public async Task<List<GoogleReviewResponseDto>> GetPublicReviewsAsync()
        {
            return await _context.GoogleReviews
                .Where(r => r.IsActive)
                .OrderBy(r => r.DisplayOrder)
                .ThenBy(r => r.CreatedAt)
                .Select(r => new GoogleReviewResponseDto
                {
                    GoogleReviewId = r.GoogleReviewId,
                    Author = r.Author,
                    Rating = r.Rating,
                    ReviewText = r.ReviewText,
                    TimeText = r.TimeText,
                    IsMainReview = r.IsMainReview,
                    DisplayOrder = r.DisplayOrder,
                    IsActive = r.IsActive
                })
                .ToListAsync();
        }

        public async Task<GoogleReviewListResponseDto> GetAllAsync(GoogleReviewFilterRequestDto filter)
        {
            var query = _context.GoogleReviews.AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var searchLower = filter.SearchQuery.ToLower();
                query = query.Where(r =>
                    r.Author.ToLower().Contains(searchLower) ||
                    (r.ReviewText != null && r.ReviewText.ToLower().Contains(searchLower)));
            }

            if (filter.IsActive.HasValue)
                query = query.Where(r => r.IsActive == filter.IsActive.Value);

            if (filter.IsMainReview.HasValue)
                query = query.Where(r => r.IsMainReview == filter.IsMainReview.Value);

            if (filter.Rating.HasValue)
                query = query.Where(r => r.Rating == filter.Rating.Value);

            var totalCount = await query.CountAsync();

            query = filter.SortBy?.ToLower() switch
            {
                "author" => filter.SortDescending
                    ? query.OrderByDescending(r => r.Author)
                    : query.OrderBy(r => r.Author),
                "rating" => filter.SortDescending
                    ? query.OrderByDescending(r => r.Rating)
                    : query.OrderBy(r => r.Rating),
                "createdat" => filter.SortDescending
                    ? query.OrderByDescending(r => r.CreatedAt)
                    : query.OrderBy(r => r.CreatedAt),
                _ => filter.SortDescending
                    ? query.OrderByDescending(r => r.DisplayOrder).ThenByDescending(r => r.CreatedAt)
                    : query.OrderBy(r => r.DisplayOrder).ThenBy(r => r.CreatedAt)
            };

            var reviews = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(r => new GoogleReviewResponseDto
                {
                    GoogleReviewId = r.GoogleReviewId,
                    Author = r.Author,
                    Rating = r.Rating,
                    ReviewText = r.ReviewText,
                    TimeText = r.TimeText,
                    IsMainReview = r.IsMainReview,
                    DisplayOrder = r.DisplayOrder,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return new GoogleReviewListResponseDto
            {
                Reviews = reviews,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<GoogleReviewResponseDto?> GetByIdAsync(Guid id)
        {
            var review = await _context.GoogleReviews.FindAsync(id);
            if (review == null) return null;

            return MapToResponse(review);
        }

        public async Task<GoogleReviewResponseDto?> CreateAsync(CreateGoogleReviewRequestDto request, Guid? createdBy = null)
        {
            var maxOrder = await _context.GoogleReviews
                .MaxAsync(r => (int?)r.DisplayOrder) ?? 0;

            var rating = Math.Clamp(request.Rating, 1, 5);

            var review = new GoogleReview
            {
                Author = request.Author.Trim(),
                Rating = rating,
                ReviewText = request.ReviewText.Trim(),
                TimeText = request.TimeText?.Trim(),
                IsMainReview = request.IsMainReview,
                DisplayOrder = request.DisplayOrder > 0 ? request.DisplayOrder : maxOrder + 1,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.GoogleReviews.Add(review);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(review.GoogleReviewId);
        }

        public async Task<GoogleReviewResponseDto?> UpdateAsync(Guid id, UpdateGoogleReviewRequestDto request)
        {
            var review = await _context.GoogleReviews.FindAsync(id);
            if (review == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Author))
                review.Author = request.Author.Trim();

            if (request.Rating.HasValue)
                review.Rating = Math.Clamp(request.Rating.Value, 1, 5);

            if (request.ReviewText != null)
                review.ReviewText = request.ReviewText.Trim();

            if (request.TimeText != null)
                review.TimeText = string.IsNullOrWhiteSpace(request.TimeText) ? null : request.TimeText.Trim();

            if (request.IsMainReview.HasValue)
                review.IsMainReview = request.IsMainReview.Value;

            if (request.DisplayOrder.HasValue)
                review.DisplayOrder = request.DisplayOrder.Value;

            if (request.IsActive.HasValue)
                review.IsActive = request.IsActive.Value;

            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var review = await _context.GoogleReviews.FindAsync(id);
            if (review == null) return false;

            _context.GoogleReviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReorderAsync(Guid[] ids)
        {
            var reviews = await _context.GoogleReviews
                .Where(r => ids.Contains(r.GoogleReviewId))
                .ToListAsync();

            if (reviews.Count != ids.Length)
                return false;

            for (int i = 0; i < ids.Length; i++)
            {
                var review = reviews.First(r => r.GoogleReviewId == ids[i]);
                review.DisplayOrder = i + 1;
                review.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleStatusAsync(Guid id)
        {
            var review = await _context.GoogleReviews.FindAsync(id);
            if (review == null) return false;

            review.IsActive = !review.IsActive;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<GoogleReviewStatsResponseDto> GetStatsAsync()
        {
            var all = await _context.GoogleReviews.ToListAsync();
            var count = all.Count;
            var featuredCount = all.Count(r => r.IsMainReview);
            var avgRating = count > 0 ? all.Average(r => r.Rating) : 0.0;

            return new GoogleReviewStatsResponseDto
            {
                TotalCount = count,
                FeaturedCount = featuredCount,
                AverageRating = Math.Round(avgRating, 1)
            };
        }

        private static GoogleReviewResponseDto MapToResponse(GoogleReview r)
        {
            return new GoogleReviewResponseDto
            {
                GoogleReviewId = r.GoogleReviewId,
                Author = r.Author,
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                TimeText = r.TimeText,
                IsMainReview = r.IsMainReview,
                DisplayOrder = r.DisplayOrder,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }
    }
}
