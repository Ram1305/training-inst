using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Course
{
    public class UpdateCourseRequestDto
    {
        [MaxLength(50)]
        public string? CourseCode { get; set; }

        [MaxLength(200)]
        public string? CourseName { get; set; }

        public Guid? CategoryId { get; set; }

        [MaxLength(100)]
        public string? Duration { get; set; }

        public decimal? Price { get; set; }

        public decimal? OriginalPrice { get; set; }

        public decimal? PromoPrice { get; set; }

        public decimal? PromoOriginalPrice { get; set; }

        public string? ImageUrl { get; set; }

        public bool? HasTheory { get; set; }

        public bool? HasPractical { get; set; }

        public bool? HasExam { get; set; }

        [MaxLength(50)]
        public string? ValidityPeriod { get; set; }

        [MaxLength(100)]
        public string? DeliveryMethod { get; set; }

        [MaxLength(300)]
        public string? Location { get; set; }

        [MaxLength(4000)]
        public string? CourseDescription { get; set; }

        public List<string>? EntryRequirements { get; set; }

        public List<string>? TrainingOverview { get; set; }

        public List<string>? VocationalOutcome { get; set; }

        public string? PathwaysDescription { get; set; }

        public List<string>? PathwaysCertifications { get; set; }

        public List<string>? FeesAndCharges { get; set; }

        public List<string>? OptionalCharges { get; set; }

        [MaxLength(300)]
        public string? ResourcePdfTitle { get; set; }

        public string? ResourcePdfUrl { get; set; }

        // Experience-based pricing
        public bool? ExperienceBookingEnabled { get; set; }

        public decimal? ExperiencePrice { get; set; }

        public decimal? ExperienceOriginalPrice { get; set; }

        public decimal? NoExperiencePrice { get; set; }

        public decimal? NoExperienceOriginalPrice { get; set; }

        public bool? ComboOfferEnabled { get; set; }

        public string? ComboDescription { get; set; }

        public decimal? ComboPrice { get; set; }

        public string? ComboDuration { get; set; }

        public bool? IsActive { get; set; }
    }
}
