using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.Data.Entities.VOC
{
    public class VOCSubmission
    {
        [Key]
        public Guid SubmissionId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string AustralianStudentId { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string StreetAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string State { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string Postcode { get; set; } = string.Empty;

        public DateTime? PreferredStartDate { get; set; }

        [MaxLength(50)]
        public string? PreferredTime { get; set; }

        public string? Comments { get; set; }

        public string SelectedCoursesJson { get; set; } = "[]"; // List of { courseId, courseDateId }

        [MaxLength(50)]
        public string? PaymentMethod { get; set; } // CreditCard, BankTransfer

        public decimal TotalAmount { get; set; }

        [MaxLength(100)]
        public string? TransactionId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Verified, Completed, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
