using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.Data.Entities.Courses
{
    public class CourseComboOffer
    {
        [Key]
        public Guid ComboOfferId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(500)]
        public string ComboDescription { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal ComboPrice { get; set; }

        [MaxLength(100)]
        public string? ComboDuration { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey(nameof(CourseId))]
        public virtual Course Course { get; set; } = null!;
    }
}
