using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Payment
{
    /// <summary>
    /// Request DTO for processing credit card payment for an existing logged-in student
    /// </summary>
    public class ProcessCardPaymentExistingStudentRequestDto
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        public Guid SelectedCourseDateId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public int AmountCents { get; set; }

        [StringLength(10)]
        public string Currency { get; set; } = "AUD";

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
