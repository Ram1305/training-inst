namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule
{
    /// <summary>
    /// DTO for student schedule calendar view.
    /// Only shows schedules for courses where enrollment is active and payment is verified.
    /// </summary>
    public class StudentScheduleCalendarDto
    {
        public Guid ScheduleId { get; set; }
        public Guid EnrollmentId { get; set; }
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string BgColor { get; set; } = string.Empty;

        // Teacher information
        public Guid? TeacherId { get; set; }
        public string? TeacherName { get; set; }

        // Enrollment context
        public DateTime EnrolledAt { get; set; }
        public string EnrollmentStatus { get; set; } = string.Empty;
    }
}
