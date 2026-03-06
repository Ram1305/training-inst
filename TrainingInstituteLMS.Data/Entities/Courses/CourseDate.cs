using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Auth;

namespace TrainingInstituteLMS.Data.Entities.Courses
{
    public class CourseDate
    {
        [Key]
        public Guid CourseDateId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(50)]
        public string DateType { get; set; } = string.Empty; // Exam, Theory, Practical

        public DateTime ScheduledDate { get; set; }

        public TimeSpan? StartTime { get; set; }

        public TimeSpan? EndTime { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? MeetingLink { get; set; }

        public int? MaxCapacity { get; set; }

        public int CurrentEnrollments { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        // Teacher assignment
        public Guid? TeacherId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid? CreatedBy { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;

        [ForeignKey(nameof(TeacherId))]
        public virtual User? Teacher { get; set; }
    }
}
