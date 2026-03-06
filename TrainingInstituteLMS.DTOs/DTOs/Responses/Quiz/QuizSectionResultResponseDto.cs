using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class QuizSectionResultResponseDto
    {
        public Guid SectionResultId { get; set; }
        public string SectionName { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public decimal SectionPercentage { get; set; }
        public bool SectionPassed { get; set; }
    }
}
