using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Files
{
    public class FileUploadRequestDto
    {
        [Required]
        public string Folder { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid? RelatedEntityId { get; set; }
    }
}
