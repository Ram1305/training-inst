using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule
{
    public class UpdateScheduleRequestDto
    {
        public Guid? CourseId { get; set; }

        public Guid? CourseDateId { get; set; }

        [MaxLength(200)]
        public string? EventTitle { get; set; }

        [MaxLength(50)]
        public string? EventType { get; set; }

        public DateTime? ScheduledDate { get; set; }

        public string? StartTime { get; set; }

        public string? EndTime { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        public int? MaxCapacity { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        // Teacher assignment
        public Guid? TeacherId { get; set; }
    }
}
