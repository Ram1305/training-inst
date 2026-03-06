namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Payment
{
    /// <summary>
    /// Response DTO for credit card payment result
    /// </summary>
    public class CardPaymentResultResponseDto
    {
        public bool Success { get; set; }
        public long TransactionId { get; set; }
        public string? ResponseCode { get; set; }
        public string? ResponseMessage { get; set; }
        public string? AuthorisationCode { get; set; }
        public string? ErrorMessages { get; set; }
        public int AmountPaidCents { get; set; }
        public decimal AmountPaid => AmountPaidCents / 100m;
        public string? InvoiceNumber { get; set; }
        
        // User/Student details (returned on successful payment + enrollment)
        public Guid? UserId { get; set; }
        public Guid? StudentId { get; set; }
        public Guid? EnrollmentId { get; set; }
        public string? StudentName { get; set; }
        public string? Email { get; set; }
        public string? CourseName { get; set; }
        public string? CourseCode { get; set; }
        public DateTime? SelectedDate { get; set; }
        public string? PaymentStatus { get; set; }
        public string? EnrollmentStatus { get; set; }
        public DateTime? BookedAt { get; set; }
    }
}
