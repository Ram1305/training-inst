using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class StudentQuizStatusResponseDto
    {
        public Guid StudentId { get; set; }
        public bool HasAttemptedQuiz { get; set; }
        public bool HasPassedQuiz { get; set; }
        public bool HasAdminBypass { get; set; }
        public bool CanEnroll { get; set; }
        public int TotalAttempts { get; set; }
        public QuizAttemptResponseDto? LatestAttempt { get; set; }
        public QuizAttemptResponseDto? PassedAttempt { get; set; }
    }
}
