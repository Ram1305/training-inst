using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz
{
    public class CreateAdminBypassRequestDto
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid QuizAttemptId { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }
    }
}
