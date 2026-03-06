using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Students;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    public class PaymentProof
    {
        [Key]
        public Guid PaymentProofId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid EnrollmentId { get; set; }

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        [MaxLength(500)]
        public string ReceiptFileUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string TransactionId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal AmountPaid { get; set; }

        public DateTime PaymentDate { get; set; }

        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Verified, Rejected

        public Guid? VerifiedBy { get; set; }

        public DateTime? VerifiedAt { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(EnrollmentId))]
        public virtual Enrollment Enrollment { get; set; } = null!;

        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;
    }
}
