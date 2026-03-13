using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Payment
{
    /// <summary>
    /// Request DTO for processing credit card payment
    /// </summary>
    public class ProcessCardPaymentRequestDto
    {
        // Customer Information
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        // Course Selection
        [Required]
        public Guid CourseId { get; set; }

        [Required]
        public Guid SelectedCourseDateId { get; set; }
        
        public string? EnrollmentCode { get; set; }

        // Payment Amount (in cents for eWay)
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public int AmountCents { get; set; }

        [StringLength(10)]
        public string Currency { get; set; } = "AUD";

        // Card Details
        [Required(ErrorMessage = "Card name is required")]
        [StringLength(100)]
        public string CardName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Card number is required")]
        [StringLength(19)]
        public string CardNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Expiry month is required")]
        [StringLength(2)]
        [RegularExpression(@"^(0[1-9]|1[0-2])$", ErrorMessage = "Expiry month must be 01-12")]
        public string ExpiryMonth { get; set; } = string.Empty;

        [Required(ErrorMessage = "Expiry year is required")]
        [StringLength(2)]
        public string ExpiryYear { get; set; } = string.Empty;

        [Required(ErrorMessage = "CVV is required")]
        [StringLength(4)]
        public string CVV { get; set; } = string.Empty;
    }
}
