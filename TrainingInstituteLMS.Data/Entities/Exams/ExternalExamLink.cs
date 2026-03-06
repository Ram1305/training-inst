using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Enrollments;

namespace TrainingInstituteLMS.Data.Entities.Exams
{
    public class ExternalExamLink
    {
        [Key]
        public Guid ExamLinkId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid EnrollmentId { get; set; }

        public Guid? CourseDateId { get; set; }

        [Required]
        [MaxLength(500)]
        public string ExamUrl { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? AccessToken { get; set; }

        public DateTime ExamDateTime { get; set; }

        public int DurationMinutes { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;
    }
}
