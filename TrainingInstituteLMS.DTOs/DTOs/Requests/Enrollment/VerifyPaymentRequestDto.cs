namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment
{
    public class VerifyPaymentRequestDto
    {
        public bool Approve { get; set; }
        public string? RejectionReason { get; set; }
    }
}
