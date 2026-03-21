namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Company
{
    public class CompanyPortalEnrollmentsResponseDto
    {
        public List<CompanyPortalEnrollmentRowDto> Items { get; set; } = new();
    }

    public class CompanyPortalEnrollmentRowDto
    {
        public string EnrollmentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseId { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        /// <summary>True when a company billing line exists for this enrollment.</summary>
        public bool HasCompanyBill { get; set; }
        /// <summary>Statement status when billed: Unpaid, Draft, Approved, Paid.</summary>
        public string? CompanyBillStatus { get; set; }
    }
}
