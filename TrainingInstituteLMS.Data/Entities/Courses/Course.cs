using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Enrollments;

namespace TrainingInstituteLMS.Data.Entities.Courses
{
    public class Course
    {
        [Key]
        public Guid CourseId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string CourseName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string CourseCode { get; set; } = string.Empty;

        // Foreign Key to Category
        public Guid? CategoryId { get; set; }

        [Required]
        [MaxLength(50)]
        public string CourseType { get; set; } = "Single"; // Single, Combo

        [MaxLength(100)]
        public string? Duration { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? OriginalPrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PromoPrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PromoOriginalPrice { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(4000)]
        public string? CourseDescription { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        [MaxLength(100)]
        public string? DeliveryMethod { get; set; }

        [MaxLength(300)]
        public string? Location { get; set; }

        [MaxLength(50)]
        public string? ValidityPeriod { get; set; }

        [MaxLength(300)]
        public string? ResourcePdfTitle { get; set; }

        [MaxLength(500)]
        public string? ResourcePdfUrl { get; set; }

        // Experience-based pricing
        public bool ExperienceBookingEnabled { get; set; } = false;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? ExperiencePrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? ExperienceOriginalPrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? NoExperiencePrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? NoExperienceOriginalPrice { get; set; }

        public bool IsActive { get; set; } = true;

        public int EnrolledStudentsCount { get; set; } = 0;

        public int DisplayOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Guid? CreatedBy { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(CategoryId))]
        public virtual CourseCategory? Category { get; set; }

        public virtual CourseRule? CourseRule { get; set; }
        public virtual CourseComboOffer? ComboOffer { get; set; }
        public virtual ICollection<CourseDate> CourseDates { get; set; } = new List<CourseDate>();
        public virtual ICollection<CourseEntryRequirement> EntryRequirements { get; set; } = new List<CourseEntryRequirement>();
        public virtual ICollection<CourseTrainingOverview> TrainingOverviews { get; set; } = new List<CourseTrainingOverview>();
        public virtual ICollection<CourseVocationalOutcome> VocationalOutcomes { get; set; } = new List<CourseVocationalOutcome>();
        public virtual ICollection<CoursePathway> Pathways { get; set; } = new List<CoursePathway>();
        public virtual ICollection<CourseFeeCharge> FeesAndCharges { get; set; } = new List<CourseFeeCharge>();
        public virtual ICollection<CourseOptionalCharge> OptionalCharges { get; set; } = new List<CourseOptionalCharge>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
