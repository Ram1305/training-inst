using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Payment
{
    public class ProcessCompanyBillingCardPaymentRequestDto
    {
        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        [MinLength(1)]
        public List<Guid> StatementIds { get; set; } = new();

        [Range(1, int.MaxValue)]
        public int AmountCents { get; set; }

        public string Currency { get; set; } = "AUD";

        [Required]
        public string CardName { get; set; } = string.Empty;

        [Required]
        public string CardNumber { get; set; } = string.Empty;

        [Required]
        public string ExpiryMonth { get; set; } = string.Empty;

        [Required]
        public string ExpiryYear { get; set; } = string.Empty;

        [Required]
        public string Cvv { get; set; } = string.Empty;
    }
}
