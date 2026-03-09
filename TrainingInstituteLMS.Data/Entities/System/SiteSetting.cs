using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.Data.Entities.System
{
    /// <summary>
    /// Key-value store for site-wide settings (e.g. enrollment base URL).
    /// </summary>
    public class SiteSetting
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Value { get; set; } = string.Empty;

        public DateTime? UpdatedAt { get; set; }
    }
}
