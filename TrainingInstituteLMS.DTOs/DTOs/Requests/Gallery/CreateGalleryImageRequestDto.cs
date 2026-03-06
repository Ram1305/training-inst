using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery
{
    public class CreateGalleryImageRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Base64 data URL (data:image/...) or full URL. If base64, will be uploaded to gallery-images folder.
        /// </summary>
        public string? ImageUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }
}
