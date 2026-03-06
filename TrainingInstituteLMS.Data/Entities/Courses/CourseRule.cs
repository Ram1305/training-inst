using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.Data.Entities.Courses
{
    public class CourseRule
    {
        [Key]
        public Guid CourseRuleId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CourseId { get; set; }

        public bool HasTheory { get; set; } = true;

        public bool HasPractical { get; set; } = true;

        public bool HasExam { get; set; } = true;

        public bool RequiresTheoryClasses { get; set; }

        public int? TheoryClassCount { get; set; }

        public bool RequiresPracticalSessions { get; set; }

        public int? PracticalSessionCount { get; set; }

        [MaxLength(50)]
        public string? ExamType { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? PassingScore { get; set; }

        public int? CertValidityMonths { get; set; }

        public bool RenewalRequired { get; set; }

        public bool ReattendTheory { get; set; }

        public bool ReattendPractical { get; set; }

        public bool RetakeExamination { get; set; }

        [MaxLength(200)]
        public string? RequiredTeacherQual { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;
    }
}
