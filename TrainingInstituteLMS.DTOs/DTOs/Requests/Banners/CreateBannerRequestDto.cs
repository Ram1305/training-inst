using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Banners
{
    public class CreateBannerRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Relative path returned by the file storage service (e.g. "banners/xxx.png").
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string ImagePath { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; } = 0;
    }
}

