using System;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Gallery
{
    public class GalleryImageResponseDto
    {
        public Guid GalleryImageId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
