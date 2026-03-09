using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    /// <summary>
    /// Stores optional settings for enrollment links (e.g. AllowPayLater).
    /// Separate table so EnrollmentLinks schema can remain unchanged for deployments without the column.
    /// </summary>
    [Table("EnrollmentLinkOptions")]
    public class EnrollmentLinkOption
    {
        [Key]
        [ForeignKey(nameof(EnrollmentLink))]
        public Guid LinkId { get; set; }

        /// <summary>
        /// When true, users opening this link complete enrollment without payment (name, email, mobile, LLN, enrollment form only).
        /// </summary>
        public bool AllowPayLater { get; set; }

        public virtual EnrollmentLink EnrollmentLink { get; set; } = null!;
    }
}
