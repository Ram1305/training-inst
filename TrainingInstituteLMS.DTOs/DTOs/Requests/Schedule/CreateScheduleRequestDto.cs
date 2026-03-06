using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule
{
    public class CreateScheduleRequestDto
    {
        [Required]
        public Guid CourseId { get; set; }

        public Guid? CourseDateId { get; set; }

        [Required]
        [MaxLength(200)]
        public string EventTitle { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = "General"; // Theory, Practical, Exam, General

        [Required]
        public DateTime ScheduledDate { get; set; }

        [Required]
        public string StartTime { get; set; } = "09:00";

        [Required]
        public string EndTime { get; set; } = "17:00";

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        public int? MaxCapacity { get; set; }

        // Teacher assignment
        public Guid? TeacherId { get; set; }
    }
}
