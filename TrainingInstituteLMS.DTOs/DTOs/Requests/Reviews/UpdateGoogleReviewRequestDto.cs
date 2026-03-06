using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews
{
    public class UpdateGoogleReviewRequestDto
    {
        [MaxLength(200)]
        public string? Author { get; set; }

        public int? Rating { get; set; }

        [MaxLength(2000)]
        public string? ReviewText { get; set; }

        [MaxLength(100)]
        public string? TimeText { get; set; }

        public bool? IsMainReview { get; set; }

        public int? DisplayOrder { get; set; }

        public bool? IsActive { get; set; }
    }
}
