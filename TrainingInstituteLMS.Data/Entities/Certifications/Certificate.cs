using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.Data.Entities.Students;

namespace TrainingInstituteLMS.Data.Entities.Certifications
{
    public class Certificate
    {
        [Key]
        public Guid CertificateId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        public Guid EnrollmentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string CertificateNumber { get; set; } = string.Empty;

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiryDate { get; set; }

        [Required]
        [MaxLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Expired, Revoked

        public Guid? UploadedBy { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;

        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;
    }
}
