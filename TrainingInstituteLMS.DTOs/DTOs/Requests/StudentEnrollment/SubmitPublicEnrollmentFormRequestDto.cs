using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment
{
    public class SubmitPublicEnrollmentFormRequestDto : SubmitEnrollmentFormRequestDto
    {
        /// <summary>
        /// Password for account creation
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Full name (from registration step)
        /// </summary>
        public string? FullName { get; set; }

        /// <summary>
        /// Phone number (from registration step)
        /// </summary>
        public string? Phone { get; set; }

        // Course Selection
        public Guid? CourseId { get; set; }
        public Guid? CourseDateId { get; set; }
        public string? EnrollmentCode { get; set; }
        public string? PaymentMethod { get; set; }

        // Payment Details
        public string? TransactionId { get; set; }
        public decimal? PaymentAmount { get; set; }
        public string? PaymentProofDataUrl { get; set; }
        public string? PaymentProofFileName { get; set; }
        public string? PaymentProofContentType { get; set; }

        // Primary Photo ID (required document)
        public string? PrimaryIdDataUrl { get; set; }
        public string? PrimaryIdFileName { get; set; }
        public string? PrimaryIdContentType { get; set; }

        // Photo / Secondary ID (required document)
        public string? SecondaryIdDataUrl { get; set; }
        public string? SecondaryIdFileName { get; set; }
        public string? SecondaryIdContentType { get; set; }

        // LLND Quiz Data
        public int? TotalQuestions { get; set; }
        public int? CorrectAnswers { get; set; }
        public double? OverallPercentage { get; set; }
        public bool? IsPassed { get; set; }
        public new string? DeclarationName { get; set; }
        public List<SubmitQuizSectionResultDto>? SectionResults { get; set; }
    }
}
