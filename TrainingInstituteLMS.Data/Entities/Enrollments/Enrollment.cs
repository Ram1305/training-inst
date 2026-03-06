using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Certifications;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.Data.Entities.Exams;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.Data.Entities.Students;

namespace TrainingInstituteLMS.Data.Entities.Enrollments
{
    public class Enrollment
    {
        [Key]
        public Guid EnrollmentId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        /// <summary>
        /// Selected course date for this enrollment
        /// </summary>
        public Guid? CourseDateId { get; set; }

        /// <summary>
        /// Quiz attempt ID - nullable to allow payment before quiz completion.
        /// Quiz can be taken after enrollment/payment.
        /// </summary>
        public Guid? QuizAttemptId { get; set; }

        public Guid? SelectedExamDateId { get; set; }

        public Guid? SelectedTheoryDateId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Verified, Rejected

        public Guid? PaymentVerifiedBy { get; set; }

        public DateTime? PaymentVerifiedAt { get; set; }

        public bool IsAdminBypassed { get; set; } = false;

        /// <summary>
        /// Indicates if the LLND quiz has been completed for this enrollment.
        /// </summary>
        public bool QuizCompleted { get; set; } = false;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Completed, Dropped

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(StudentId))]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;

        [ForeignKey(nameof(CourseDateId))]
        public virtual CourseDate? CourseDate { get; set; }

        [ForeignKey(nameof(QuizAttemptId))]
        public virtual PreEnrollmentQuizAttempt? QuizAttempt { get; set; }

        public virtual PaymentProof? PaymentProof { get; set; }
        public virtual ExternalExamLink? ExternalExamLink { get; set; }
        public virtual ExamResult? ExamResult { get; set; }
        public virtual CertificateApproval? CertificateApproval { get; set; }
        public virtual Certificate? Certificate { get; set; }
    }
}
