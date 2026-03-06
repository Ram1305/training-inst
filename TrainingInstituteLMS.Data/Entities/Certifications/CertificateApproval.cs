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
    public class CertificateApproval
    {
        [Key]
        public Guid ApprovalId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid EnrollmentId { get; set; }

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? ExamScore { get; set; }

        [Required]
        [MaxLength(50)]
        public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Rejected

        public Guid? ApprovedByTeacher { get; set; }

        public DateTime? TeacherApprovalDate { get; set; }

        [MaxLength(500)]
        public string? TeacherComments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;

        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;
    }
}
