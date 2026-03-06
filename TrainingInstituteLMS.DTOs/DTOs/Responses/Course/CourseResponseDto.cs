using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Course
{
    public class CourseResponseDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;

        // Category information
        public Guid? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        public string? Duration { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public decimal? PromoPrice { get; set; }
        public decimal? PromoOriginalPrice { get; set; }
        public string? ImageUrl { get; set; }
        public bool HasTheory { get; set; }
        public bool HasPractical { get; set; }
        public bool HasExam { get; set; }
        public string? ValidityPeriod { get; set; }
        public string? DeliveryMethod { get; set; }
        public string? Location { get; set; }
        public string? Description { get; set; }
        public string? CourseDescription { get; set; }
        public int EnrolledStudentsCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Experience-based pricing
        public bool ExperienceBookingEnabled { get; set; }
        public decimal? ExperiencePrice { get; set; }
        public decimal? ExperienceOriginalPrice { get; set; }
        public decimal? NoExperiencePrice { get; set; }
        public decimal? NoExperienceOriginalPrice { get; set; }

        // Related data
        public List<string> EntryRequirements { get; set; } = new();
        public List<string> TrainingOverview { get; set; } = new();
        public List<string> VocationalOutcome { get; set; } = new();
        public CoursePathwaysDto? Pathways { get; set; }
        public List<string> FeesAndCharges { get; set; } = new();
        public List<string> OptionalCharges { get; set; } = new();
        public CourseResourcePdfDto? ResourcePdf { get; set; }
        public CourseComboOfferDto? ComboOffer { get; set; }
    }

    public class CoursePathwaysDto
    {
        public string? Description { get; set; }
        public List<string> Certifications { get; set; } = new();
    }

    public class CourseResourcePdfDto
    {
        public string? Title { get; set; }
        public string? Url { get; set; }
    }

    public class CourseComboOfferDto
    {
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Duration { get; set; }
    }
}
