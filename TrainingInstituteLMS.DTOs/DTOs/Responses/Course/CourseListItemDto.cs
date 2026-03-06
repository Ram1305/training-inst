using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Course
{
    public class CourseListItemDto
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
        public string? Description { get; set; }
        public int EnrolledStudentsCount { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public bool HasComboOffer { get; set; }
        public DateTime CreatedAt { get; set; }

        // Experience-based pricing
        public bool ExperienceBookingEnabled { get; set; }
        public decimal? ExperiencePrice { get; set; }
        public decimal? ExperienceOriginalPrice { get; set; }
        public decimal? NoExperiencePrice { get; set; }
        public decimal? NoExperienceOriginalPrice { get; set; }
    }
}
