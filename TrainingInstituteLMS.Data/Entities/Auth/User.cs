using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Companies;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.Data.Entities.System;

namespace TrainingInstituteLMS.Data.Entities.Auth
{
    public class User
    {
        [Key]
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        [MaxLength(50)]
        public string UserType { get; set; } = "Student"; // SuperAdmin, Admin, Teacher, Student

        public bool IsActive { get; set; } = true;

        public Guid? CreatedBy { get; set; }

        [MaxLength(50)]
        public string? CreatedByRole { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(CreatedBy))]
        public virtual User? Creator { get; set; }

        public virtual Student? Student { get; set; }
        public virtual Company? Company { get; set; }
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
}
