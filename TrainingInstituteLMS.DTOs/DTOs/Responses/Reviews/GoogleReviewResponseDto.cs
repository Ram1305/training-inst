using System;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Reviews
{
    public class GoogleReviewResponseDto
    {
        public Guid GoogleReviewId { get; set; }
        public string Author { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string ReviewText { get; set; } = string.Empty;
        public string? TimeText { get; set; }
        public bool IsMainReview { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
