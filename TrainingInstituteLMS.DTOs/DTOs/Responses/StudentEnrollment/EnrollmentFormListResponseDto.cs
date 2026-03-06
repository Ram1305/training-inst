using System;
using System.Collections.Generic;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment
{
    /// <summary>
    /// List response for enrollment forms (admin view)
    /// </summary>
    public class EnrollmentFormListResponseDto
    {
        public List<EnrollmentFormListItemDto> EnrollmentForms { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Summary item for enrollment form list
    /// </summary>
    public class EnrollmentFormListItemDto
    {
        public Guid StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Status { get; set; } // Pending, Approved, Rejected
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedByName { get; set; }
        public int EnrollmentCount { get; set; }
        public bool IsActive { get; set; }
    }
}
