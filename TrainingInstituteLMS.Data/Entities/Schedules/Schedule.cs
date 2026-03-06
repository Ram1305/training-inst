using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Courses;

namespace TrainingInstituteLMS.Data.Entities.Schedules
{
    public class Schedule
    {
        [Key]
        public Guid ScheduleId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CourseId { get; set; }

        public Guid? CourseDateId { get; set; }

        [Required]
        public Guid ScheduleTypeId { get; set; }

        public Guid? TeacherId { get; set; }

        [Required]
        [MaxLength(200)]
        public string EventTitle { get; set; } = string.Empty;

        public DateTime ScheduledDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;

        [ForeignKey(nameof(ScheduleTypeId))]
        public virtual ScheduleType ScheduleType { get; set; } = null!;
    }
}
