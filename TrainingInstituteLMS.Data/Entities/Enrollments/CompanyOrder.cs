using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    /// <summary>
    /// Represents a company bulk order: multiple courses purchased, one-time links sent to company email.
    /// </summary>
    public class CompanyOrder
    {
        [Key]
        public Guid OrderId { get; set; } = Guid.NewGuid();

        /// <summary>Optional link to Companies table when company registered with password.</summary>
        public Guid? CompanyId { get; set; }

        [Required]
        [MaxLength(256)]
        public string CompanyEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? CompanyMobile { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // pay_later, bank_transfer, card

        [MaxLength(50)]
        public string Status { get; set; } = "Completed";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
