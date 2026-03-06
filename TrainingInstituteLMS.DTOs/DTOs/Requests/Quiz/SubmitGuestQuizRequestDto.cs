using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz
{
    /// <summary>
    /// Request DTO for submitting quiz results as a guest (from landing page LLND test)
    /// This will create a new user, student, and quiz attempt in one transaction
    /// </summary>
    public class SubmitGuestQuizRequestDto
    {
        // User Registration Details
        [Required]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        // Quiz Results
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
