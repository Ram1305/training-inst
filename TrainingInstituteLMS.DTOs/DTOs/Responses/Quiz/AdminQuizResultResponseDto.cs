using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class AdminQuizResultResponseDto
    {
        public Guid QuizAttemptId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string? StudentPhone { get; set; }
        public DateTime AttemptDate { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public decimal OverallPercentage { get; set; }
        public bool IsPassed { get; set; }
        public string Status { get; set; } = string.Empty; // Pending, Approved, Rejected
        public DateTime? CompletedAt { get; set; }
        public bool HasAdminBypass { get; set; }
        public AdminBypassResponseDto? AdminBypass { get; set; }
        public List<QuizSectionResultResponseDto> SectionResults { get; set; } = new();
    }
}
