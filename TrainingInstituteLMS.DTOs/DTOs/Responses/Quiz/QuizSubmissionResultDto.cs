using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class QuizSubmissionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid QuizAttemptId { get; set; }
        public bool IsPassed { get; set; }
        public decimal OverallPercentage { get; set; }
        public bool CanEnroll { get; set; }
        public List<QuizSectionResultResponseDto> SectionResults { get; set; } = new();
    }
}
