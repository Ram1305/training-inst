using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery
{
    public class UpdateGalleryImageRequestDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public bool? IsActive { get; set; }
    }
}
