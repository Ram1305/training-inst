namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class PaymentProofResponseDto
    {
        public Guid PaymentProofId { get; set; }
        public Guid EnrollmentId { get; set; }
        public string ReceiptFileUrl { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? BankName { get; set; }
        public string? ReferenceNumber { get; set; }
        public DateTime UploadedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? VerifiedAt { get; set; }
        public string? RejectionReason { get; set; }
    }
}
