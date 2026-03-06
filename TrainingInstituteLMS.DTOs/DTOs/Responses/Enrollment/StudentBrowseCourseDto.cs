namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    /// <summary>
    /// DTO for displaying courses available for student enrollment in browse view
    /// </summary>
    public class StudentBrowseCourseDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? Duration { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? ImageUrl { get; set; }
        public bool HasTheory { get; set; }
        public bool HasPractical { get; set; }
        public bool HasExam { get; set; }
        public string? ValidityPeriod { get; set; }
        public string? Description { get; set; }
        public int EnrolledStudentsCount { get; set; }
        
        /// <summary>
        /// Next available batch date for this course
        /// </summary>
        public DateTime? NextBatchDate { get; set; }
        
        /// <summary>
        /// Available dates for enrollment (unique dates only, grouped by day)
        /// </summary>
        public List<AvailableDateDto> AvailableDates { get; set; } = new();
    }

    /// <summary>
    /// Represents a unique available date for enrollment (grouped by day)
    /// </summary>
    public class AvailableDateDto
    {
        /// <summary>
        /// The first course date ID for this day (used for enrollment)
        /// </summary>
        public Guid CourseDateId { get; set; }
        
        /// <summary>
        /// The scheduled date (date only, no time)
        /// </summary>
        public DateTime ScheduledDate { get; set; }
        
        /// <summary>
        /// Number of sessions scheduled for this day
        /// </summary>
        public int SessionCount { get; set; }
        
        /// <summary>
        /// Types of sessions available on this day (e.g., "Theory, Practical, Exam")
        /// </summary>
        public string SessionTypes { get; set; } = string.Empty;
        
        /// <summary>
        /// Location (if all sessions on this day are at the same location)
        /// </summary>
        public string? Location { get; set; }
        
        /// <summary>
        /// Total available spots across all sessions on this day
        /// </summary>
        public int AvailableSpots { get; set; }
        
        /// <summary>
        /// Whether this date is available for enrollment
        /// </summary>
        public bool IsAvailable { get; set; }
    }
}
