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

namespace TrainingInstituteLMS.Data.Entities.Exams
{
    public class ExamResult
    {
        [Key]
        public Guid ResultId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid EnrollmentId { get; set; }

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Percentage { get; set; }

        public bool IsPassed { get; set; }

        [MaxLength(100)]
        public string? ExternalExamId { get; set; }

        public DateTime? CompletedAt { get; set; }

        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;

        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;
    }
}
