using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz
{
    public class SubmitQuizRequestDto
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public int TotalQuestions { get; set; }

        [Required]
        public int CorrectAnswers { get; set; }

        [Required]
        [Range(0, 100)]
        public decimal OverallPercentage { get; set; }

        [Required]
        public bool IsPassed { get; set; }

        [Required]
        [MaxLength(200)]
        public string DeclarationName { get; set; } = string.Empty;

        [Required]
        public List<SubmitQuizSectionResultDto> SectionResults { get; set; } = new();
    }
}
