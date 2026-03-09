namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    /// <summary>
    /// Detailed payment proof information for admin review
    /// </summary>
    public class AdminPaymentProofResponseDto
    {
        public Guid PaymentProofId { get; set; }
        public Guid EnrollmentId { get; set; }
        
        // Student Information
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        
        // Course Information
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public decimal CoursePrice { get; set; }

        /// <summary>
        /// Date when the student enrolled in this course (enrollment selected/created).
        /// </summary>
        public DateTime EnrolledAt { get; set; }

        /// <summary>
        /// The course session date the student selected when enrolling (e.g. the date they chose for the course).
        /// </summary>
        public DateTime? SelectedCourseDate { get; set; }
        
        // Payment Details
        public string ReceiptFileUrl { get; set; } = string.Empty;
        public string ReceiptFileName { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? BankName { get; set; }
        public string? ReferenceNumber { get; set; }
        
        // Status Information
        public DateTime UploadedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? VerifiedBy { get; set; }
        public string? VerifiedByName { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string? RejectionReason { get; set; }
    }
}
