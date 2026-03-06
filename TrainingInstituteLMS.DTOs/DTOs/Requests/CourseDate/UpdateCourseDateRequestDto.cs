using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.CourseDate
{
    public class UpdateCourseDateRequestDto
    {
        [MaxLength(50)]
        public string? DateType { get; set; }

        public DateTime? ScheduledDate { get; set; }

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        public int? MaxCapacity { get; set; }

        public bool? IsActive { get; set; }

        // Teacher assignment
        public Guid? TeacherId { get; set; }
    }
}
