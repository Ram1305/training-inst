using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    /// <summary>
    /// Represents a shareable enrollment link with QR code for bulk student enrollment
    /// </summary>
    public class EnrollmentLink
    {
        [Key]
        public Guid LinkId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        /// <summary>
        /// Unique code for the URL (e.g., "jan-2025-batch")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string UniqueCode { get; set; } = string.Empty;
        
        /// <summary>
        /// Optional: Pre-select a course for this link
        /// </summary>
        public Guid? CourseId { get; set; }
        
        /// <summary>
        /// Optional: Pre-select a course date for this link
        /// </summary>
        public Guid? CourseDateId { get; set; }
        
        /// <summary>
        /// Base64 encoded QR code image
        /// </summary>
        public string? QrCodeData { get; set; }
        
        public DateTime? ExpiresAt { get; set; }
        
        public int? MaxUses { get; set; }
        
        public int UsedCount { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Guid? CreatedBy { get; set; }
        
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// When set, this link was created as part of a company order (one-time link per course).
        /// </summary>
        public Guid? CompanyOrderId { get; set; }

        /// <summary>
        /// Optional settings stored in separate table (e.g. AllowPayLater). Use Option?.AllowPayLater ?? false.
        /// </summary>
        public virtual EnrollmentLinkOption? Option { get; set; }

        // Navigation properties
        [ForeignKey(nameof(CourseId))]
        public virtual Courses.Course? Course { get; set; }
        
        [ForeignKey(nameof(CourseDateId))]
        public virtual Courses.CourseDate? CourseDate { get; set; }

        [ForeignKey(nameof(CompanyOrderId))]
        public virtual CompanyOrder? CompanyOrder { get; set; }
    }
}
