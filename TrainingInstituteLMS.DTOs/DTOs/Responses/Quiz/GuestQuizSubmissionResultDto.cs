namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    /// <summary>
    /// Response DTO for guest quiz submission
    /// Contains user registration info and quiz results
    /// </summary>
    public class GuestQuizSubmissionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;

        // User Registration Info
        public Guid UserId { get; set; }
        public Guid StudentId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;

        // Quiz Info
        public Guid QuizAttemptId { get; set; }
        public bool IsPassed { get; set; }
        public decimal OverallPercentage { get; set; }
        public bool CanEnroll { get; set; }
        public List<QuizSectionResultResponseDto> SectionResults { get; set; } = new();
    }
}
