using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.Data.Entities.Gallery
{
    public class GalleryImage
    {
        [Key]
        public Guid GalleryImageId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Guid? CreatedBy { get; set; }
    }
}
