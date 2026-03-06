using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz
{
    public class SubmitQuizSectionResultDto
    {
        [Required]
        [MaxLength(50)]
        public string SectionName { get; set; } = string.Empty;

        [Required]
        public int TotalQuestions { get; set; }

        [Required]
        public int CorrectAnswers { get; set; }

        [Required]
        [Range(0, 100)]
        public decimal SectionPercentage { get; set; }

        [Required]
        public bool SectionPassed { get; set; }
    }
}
