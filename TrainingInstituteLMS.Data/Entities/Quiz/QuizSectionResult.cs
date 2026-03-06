using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.Data.Entities.Quiz
{
    public class QuizSectionResult
    {
        [Key]
        public Guid SectionResultId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid QuizAttemptId { get; set; }

        [Required]
        [MaxLength(50)]
        public string SectionName { get; set; } = string.Empty; // Numeracy, Literacy, Digital Literacy

        public int TotalQuestions { get; set; } = 5;

        public int CorrectAnswers { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal SectionPercentage { get; set; }

        public bool SectionPassed { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(QuizAttemptId))]
        public virtual PreEnrollmentQuizAttempt QuizAttempt { get; set; } = null!;
    }
}
