using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Students;

namespace TrainingInstituteLMS.Data.Entities.Quiz
{
    public class AdminBypass
    {
        [Key]
        public Guid BypassId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid QuizAttemptId { get; set; }

        [Required]
        public Guid BypassedBy { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        public DateTime BypassedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // Navigation Properties
        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey(nameof(QuizAttemptId))]
        public virtual PreEnrollmentQuizAttempt QuizAttempt { get; set; } = null!;

        [ForeignKey(nameof(BypassedBy))]
        public virtual User Admin { get; set; } = null!;
    }
}
