using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.CourseDate
{
    public class CourseDateResponseDto
    {
        public Guid CourseDateId { get; set; }
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string DateType { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public int? MaxCapacity { get; set; }
        public int CurrentEnrollments { get; set; }
        public int AvailableSpots { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }

        // Teacher information
        public Guid? TeacherId { get; set; }
        public string? TeacherName { get; set; }
        public string? TeacherEmail { get; set; }
    }
}
