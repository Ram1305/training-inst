using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.Data.Entities.Courses
{
    public class CoursePathway
    {
        [Key]
        public Guid PathwayId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CourseId { get; set; }

        [MaxLength(1000)]
        public string? PathwayDescription { get; set; }

        [MaxLength(500)]
        public string? CertificationCode { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;
    }
}
