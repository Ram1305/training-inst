namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class EnrollmentResponseDto
    {
        public Guid EnrollmentId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        
        /// <summary>
        /// Quiz attempt ID - nullable for payment-first flow
        /// </summary>
        public Guid? QuizAttemptId { get; set; }
        public decimal QuizScore { get; set; }
        
        /// <summary>
        /// Indicates if the LLND quiz has been completed for this enrollment
        /// </summary>
        public bool QuizCompleted { get; set; }
        
        public Guid? SelectedExamDateId { get; set; }
        public DateTime? SelectedExamDate { get; set; }
        public Guid? SelectedTheoryDateId { get; set; }
        public DateTime? SelectedTheoryDate { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime? PaymentVerifiedAt { get; set; }
        public bool IsAdminBypassed { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public PaymentProofResponseDto? PaymentProof { get; set; }
    }
}
