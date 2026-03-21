namespace TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling
{
    public class CompanyBillingStatementListResponseDto
    {
        public List<CompanyBillingStatementListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class CompanyBillingStatementListItemDto
    {
        public string StatementId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string SydneyBillingDate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string? PaymentMethod { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? PaymentReference { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int LineCount { get; set; }

        /// <summary>Set when the statement has a single line (typical per-course bill).</summary>
        public string? PrimaryCourseName { get; set; }

        public string? PrimaryStudentName { get; set; }

        public decimal PaidAmount { get; set; }

        public decimal BalanceDue { get; set; }
    }

    public class CompanyBillingStatementDetailDto : CompanyBillingStatementListItemDto
    {
        public List<CompanyBillingLineItemDto> Lines { get; set; } = new();
    }

    public class CompanyBillingLineItemDto
    {
        public string LineId { get; set; } = string.Empty;
        public string EnrollmentId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? CourseName { get; set; }
        public string? StudentName { get; set; }
        public string? StudentEmail { get; set; }
        public DateTime EnrolledAt { get; set; }
    }

    public class UpdateCompanyBillingStatementRequestDto
    {
        public string Status { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? PaymentReference { get; set; }
    }

    public class CompanyBillingBankTransferSubmissionResponseDto
    {
        public string SubmissionId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
