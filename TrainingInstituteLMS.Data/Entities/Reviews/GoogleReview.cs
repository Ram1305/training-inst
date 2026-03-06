using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.Data.Entities.Reviews
{
    public class GoogleReview
    {
        [Key]
        public Guid GoogleReviewId { get; set; } = Guid.NewGuid();

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

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Guid? CreatedBy { get; set; }
    }
}
