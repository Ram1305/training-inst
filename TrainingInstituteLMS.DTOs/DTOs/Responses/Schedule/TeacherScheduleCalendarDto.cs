namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule
{
    /// <summary>
    /// DTO for teacher schedule calendar view.
    /// Only shows schedules assigned to the specific teacher.
    /// </summary>
    public class TeacherScheduleCalendarDto
    {
        public Guid ScheduleId { get; set; }
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

        // Enrollment context
        public int EnrolledStudentsCount { get; set; }
        public int? MaxCapacity { get; set; }
    }
}
