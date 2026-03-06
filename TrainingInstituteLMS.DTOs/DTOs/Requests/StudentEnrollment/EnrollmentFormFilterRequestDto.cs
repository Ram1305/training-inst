using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment
{
    /// <summary>
    /// Filter DTO for admin to query enrollment forms
    /// </summary>
    public class EnrollmentFormFilterRequestDto
    {
        public string? SearchQuery { get; set; }

        /// <summary>
        /// Filter by form status: Pending, Approved, Rejected, or null for all
        /// </summary>
        public string? Status { get; set; }

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public string? SortBy { get; set; } = "submittedAt";

        public bool SortDescending { get; set; } = true;

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 10;
    }
}
