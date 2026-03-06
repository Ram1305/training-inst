using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Course
{
    public class CourseStatsResponseDto
    {
        public int TotalCourses { get; set; }
        public int ActiveCourses { get; set; }
        public int InactiveCourses { get; set; }
        public int CoursesWithComboOffers { get; set; }
        public int TotalEnrollments { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageCourseprice { get; set; }
        public int TotalCategories { get; set; }
        public List<CategoryStatsDto> CategoryStats { get; set; } = new();
        public List<MonthlyStatsDto> MonthlyEnrollments { get; set; } = new();
        public List<TopCourseDto> TopCourses { get; set; } = new();
    }

    public class CategoryStatsDto
    {
        public Guid CategoryId { get; set; }
        public string Category { get; set; } = string.Empty;
        public int CourseCount { get; set; }
        public int EnrollmentCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class MonthlyStatsDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int EnrollmentCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class TopCourseDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public int EnrollmentCount { get; set; }
        public decimal Revenue { get; set; }
    }
}
