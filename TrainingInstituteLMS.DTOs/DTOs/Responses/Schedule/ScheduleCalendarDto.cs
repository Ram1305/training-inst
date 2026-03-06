namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule
{
    public class ScheduleCalendarDto
    {
        public Guid ScheduleId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
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
    }
}
