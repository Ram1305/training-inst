using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment
{
    /// <summary>
    /// DTO for admin to review and approve/reject enrollment form
    /// </summary>
    public class ReviewEnrollmentFormRequestDto
    {
        [Required]
        public bool Approve { get; set; }

        [MaxLength(1000)]
        public string? ReviewNotes { get; set; }
    }
}
