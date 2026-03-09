namespace TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment
{
    public class CourseDropdownItemDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Duration { get; set; }
        public string? CategoryName { get; set; }
    }
    
    public class CourseDateDropdownItemDto
    {
        public Guid CourseDateId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Location { get; set; }
        public int AvailableSlots { get; set; }
        public int MaxCapacity { get; set; }
        public bool IsAvailable { get; set; }
    }
    
    public class PublicRegistrationResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
    
    public class PublicCourseEnrollmentResponseDto
    {
        public string EnrollmentId { get; set; } = string.Empty;
        public string CourseId { get; set; } = string.Empty;
        public string CourseDateId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
    
    public class EnrollmentLinkResponseDto
    {
        public string LinkId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CourseId { get; set; }
        public string? CourseName { get; set; }
        public string? CourseDateId { get; set; }
        public string? CourseDateRange { get; set; }
        public string UniqueCode { get; set; } = string.Empty;
        public string FullUrl { get; set; } = string.Empty;
        public string QrCodeDataUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
    }
    
    public class EnrollmentLinkListResponseDto
    {
        public List<EnrollmentLinkResponseDto> Links { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
    
    public class EnrollmentLinkDataDto
    {
        public string LinkId { get; set; } = string.Empty;
        public string? CourseId { get; set; }
        public string? CourseName { get; set; }
        public string? CourseDateId { get; set; }
        public string? CourseDateRange { get; set; }
        /// <summary>
        /// When true, the user should see only name/email/phone/password and complete via link (no payment, no LLN).
        /// </summary>
        public bool IsOneTimeLink { get; set; }
    }

    public class CompanyOrderResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string CompanyEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public List<CompanyOrderLinkDto> Links { get; set; } = new();
    }

    public class CompanyOrderLinkDto
    {
        public string LinkId { get; set; } = string.Empty;
        public string FullUrl { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
    }

    public class CompanyCardPaymentResponseDto
    {
        public string TransactionId { get; set; } = string.Empty;
    }

    public class OneTimeLinkCompleteResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}
