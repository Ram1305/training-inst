using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews
{
    public class CreateGoogleReviewRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string Author { get; set; } = string.Empty;

        public int Rating { get; set; } = 5;

        [Required]
        [MaxLength(2000)]
        public string ReviewText { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? TimeText { get; set; }

        public bool IsMainReview { get; set; } = false;

        public int DisplayOrder { get; set; } = 0;
    }
}
