namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class BookingDetailsCourseDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int EnrollmentCount { get; set; }
        public string? CategoryName { get; set; }
        public string CourseType { get; set; } = "Single"; // Single, Combo
    }
}
