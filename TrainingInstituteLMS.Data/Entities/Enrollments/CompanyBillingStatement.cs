using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrainingInstituteLMS.Data.Entities.Companies;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    /// <summary>
    /// Company billing statement: legacy daily (Sydney) batches or per-course rows after training is marked complete.
    /// </summary>
    public class CompanyBillingStatement
    {
        [Key]
        public Guid StatementId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompanyId { get; set; }

        /// <summary>Sydney civil date for which enrollments are grouped.</summary>
        public DateOnly SydneyBillingDate { get; set; }

        /// <summary>Unpaid (payable immediately on the company portal), PartiallyPaid, Paid. Draft/Approved are legacy and normalized to Unpaid when there is a balance.</summary>
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Unpaid";

        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalAmount { get; set; }

        /// <summary>Cumulative amount received toward this statement (partial or full payments).</summary>
        [Column(TypeName = "decimal(12,2)")]
        public decimal PaidAmount { get; set; }

        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        public DateTime? PaidAt { get; set; }

        [MaxLength(200)]
        public string? PaymentReference { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Guid? ApprovedBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public virtual Company Company { get; set; } = null!;

        public virtual ICollection<CompanyBillingLine> Lines { get; set; } = new List<CompanyBillingLine>();
    }
}
