namespace TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment
{
    public class PublicRegistrationRequestDto
    {
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public required string Password { get; set; }
    }
    
    public class PublicCourseEnrollmentRequestDto
    {
        public required Guid StudentId { get; set; }
        public required Guid CourseId { get; set; }
        public required Guid CourseDateId { get; set; }
        public required string PaymentMethod { get; set; } // bank_transfer, cash, card
    }
    
    public class CreateEnrollmentLinkRequestDto
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public Guid? CourseId { get; set; }
        public Guid? CourseDateId { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
    }

    /// <summary>
    /// Request to create a company order: multiple courses, one-time links sent to company email.
    /// </summary>
    public class CompanyOrderRequestDto
    {
        public required string CompanyEmail { get; set; }
        public required string CompanyName { get; set; }
        public string? CompanyMobile { get; set; }
        public required List<CompanyOrderItemDto> Items { get; set; }
        public required string PaymentMethod { get; set; } // pay_later, bank_transfer, card
        public string? TransactionId { get; set; }
        public string? PaymentProofDataUrl { get; set; }
        public string? PaymentProofFileName { get; set; }
        public string? PaymentProofContentType { get; set; }
    }

    public class CompanyOrderItemDto
    {
        public required Guid CourseId { get; set; }
        public Guid? CourseDateId { get; set; }
        public decimal Price { get; set; }
    }

    /// <summary>
    /// Request to process company order payment by card (charge only; order is created separately with transactionId).
    /// </summary>
    public class CompanyCardPaymentRequestDto
    {
        public required string CompanyName { get; set; }
        public required string CompanyEmail { get; set; }
        public string? CompanyMobile { get; set; }
        public long TotalAmountCents { get; set; }
        public required string CardName { get; set; }
        public required string CardNumber { get; set; }
        public required string ExpiryMonth { get; set; }
        public required string ExpiryYear { get; set; }
        public required string Cvv { get; set; }
    }

    /// <summary>
    /// Request to complete enrollment via a one-time link (name, email, phone, password only).
    /// </summary>
    public class OneTimeLinkCompleteRequestDto
    {
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public required string Password { get; set; }
    }
}
