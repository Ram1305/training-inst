using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class QuizAttemptResponseDto
    {
        public Guid QuizAttemptId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public DateTime AttemptDate { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers => TotalQuestions - CorrectAnswers;
        public decimal OverallPercentage { get; set; }
        public bool IsPassed { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public bool HasAdminBypass { get; set; }
        public List<QuizSectionResultResponseDto> SectionResults { get; set; } = new();
    }
}
