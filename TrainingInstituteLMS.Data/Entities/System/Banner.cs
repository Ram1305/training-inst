using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.Data.Entities.System
{
    public class Banner
    {
        [Key]
        public Guid BannerId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Relative path returned by the file storage service (stored in DB).
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string ImagePath { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}

