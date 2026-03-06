namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule
{
    public class ScheduleResponseDto
    {
        public Guid ScheduleId { get; set; }
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public Guid? CourseDateId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public int? MaxCapacity { get; set; }
        public int CurrentEnrollments { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // Teacher information
        public Guid? TeacherId { get; set; }
        public string? TeacherName { get; set; }
        public string? TeacherEmail { get; set; }
    }
}
