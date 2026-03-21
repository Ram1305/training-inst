using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrainingInstituteLMS.Data.Entities.Companies;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    /// <summary>
    /// Company-submitted bank transfer for billing; academy verifies then applies to statement balances.
    /// </summary>
    public class CompanyBillingPaymentSubmission
    {
        [Key]
        public Guid SubmissionId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompanyId { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Method { get; set; } = "bank_transfer";

        [MaxLength(500)]
        public string? ReceiptFileUrl { get; set; }

        [MaxLength(200)]
        public string? CustomerReference { get; set; }

        /// <summary>JSON array of statement GUIDs, in payment allocation order.</summary>
        [Required]
        [MaxLength(4000)]
        public string StatementIdsJson { get; set; } = "[]";

        /// <summary>Pending, Applied, Rejected</summary>
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? AppliedAt { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public virtual Company Company { get; set; } = null!;
    }
}
