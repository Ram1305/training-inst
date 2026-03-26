using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Banners
{
    public class UpdateBannerRequestDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        /// <summary>
        /// Optional relative image path; if changed, the old image can be deleted by admin manually.
        /// </summary>
        [MaxLength(500)]
        public string? ImagePath { get; set; }

        public bool? IsActive { get; set; }

        public int? SortOrder { get; set; }
    }
}

