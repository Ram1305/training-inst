using System;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Banners
{
    public class BannerResponseDto
    {
        public Guid BannerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

