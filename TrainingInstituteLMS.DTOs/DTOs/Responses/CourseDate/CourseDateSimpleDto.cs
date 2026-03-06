using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.CourseDate
{
    public class CourseDateSimpleDto
    {
        public Guid CourseDateId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string DateType { get; set; } = string.Empty;
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Location { get; set; }
        public string? MeetingLink { get; set; }
        public int AvailableSpots { get; set; }
        public int CurrentEnrollments { get; set; }
        public bool IsAvailable { get; set; }
    }
}
