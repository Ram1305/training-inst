using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrainingInstituteLMS.Data.Entities.Auth;

namespace TrainingInstituteLMS.Data.Entities.Companies
{
    public class Company
    {
        [Key]
        public Guid CompanyId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? MobileNumber { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}
