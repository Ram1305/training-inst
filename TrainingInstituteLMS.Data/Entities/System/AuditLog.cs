using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Auth;

namespace TrainingInstituteLMS.Data.Entities.System
{
    public class AuditLog
    {
        [Key]
        public Guid AuditId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string UserRole { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty; // Created, Updated, Deleted, Approved, Rejected, Bypassed

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; // User, Course, Enrollment, Payment, Quiz, Bypass

        [MaxLength(100)]
        public string? EntityType { get; set; }

        public Guid? EntityId { get; set; }

        [Column(TypeName = "nvarchar(max)")]  
        public string? OldValues { get; set; }

        [Column(TypeName = "nvarchar(max)")]  
        public string? NewValues { get; set; }

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? Status { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}
