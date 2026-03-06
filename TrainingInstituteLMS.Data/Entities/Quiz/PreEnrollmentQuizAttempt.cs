using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Students;

namespace TrainingInstituteLMS.Data.Entities.Quiz
{
    public class PreEnrollmentQuizAttempt
    {
        [Key]
        public Guid QuizAttemptId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudentId { get; set; }

        public DateTime AttemptDate { get; set; } = DateTime.UtcNow;

        public int TotalQuestions { get; set; } = 15;

        public int CorrectAnswers { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal OverallPercentage { get; set; }

        public bool IsPassed { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Completed"; // Completed, Bypassed

        public DateTime? CompletedAt { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        public virtual ICollection<QuizSectionResult> QuizSectionResults { get; set; } = new List<QuizSectionResult>();
        public virtual AdminBypass? AdminBypass { get; set; }
    }
}
