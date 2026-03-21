using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    public class CompanyBillingLine
    {
        [Key]
        public Guid LineId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StatementId { get; set; }

        [Required]
        public Guid EnrollmentId { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }

        [MaxLength(200)]
        public string? CourseNameSnapshot { get; set; }

        [MaxLength(200)]
        public string? StudentNameSnapshot { get; set; }

        [ForeignKey(nameof(StatementId))]
        public virtual CompanyBillingStatement Statement { get; set; } = null!;

        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;
    }
}
