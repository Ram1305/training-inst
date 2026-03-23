namespace TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment
{
    public class EnrollmentBaseUrlResponseDto
    {
        public string EnrollmentBaseUrl { get; set; } = string.Empty;
    }

    /// <summary>
    /// Public GA4 / gtag measurement id for the SPA (from SiteSettings, then Analytics:GtagMeasurementId config).
    /// </summary>
    public class GtagConfigResponseDto
    {
        public string? GtagMeasurementId { get; set; }
    }

    public class CourseDropdownItemDto
    {
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Duration { get; set; }
        public string? CategoryName { get; set; }
        public string? ImageUrl { get; set; }

        // Experience-based pricing (same shape as course list for public UI)
        public bool ExperienceBookingEnabled { get; set; }
        public decimal? ExperiencePrice { get; set; }
        public decimal? ExperienceOriginalPrice { get; set; }
        public decimal? NoExperiencePrice { get; set; }
        public decimal? NoExperienceOriginalPrice { get; set; }

        /// <summary>SL + BL and similar promos (e.g. RIIHAN301E).</summary>
        public decimal? PromoPrice { get; set; }
        public decimal? PromoOriginalPrice { get; set; }
        /// <summary>Active combo offer price only (mirrors public course detail API).</summary>
        public decimal? ComboOfferPrice { get; set; }
    }
    
    public class CourseDateDropdownItemDto
    {
        public Guid CourseDateId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public string? DateType { get; set; }
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
        public bool AllowPayLater { get; set; }
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
        /// <summary>
        /// When true, users complete full flow without payment (name, email, mobile, LLN, enrollment form only).
        /// </summary>
        public bool AllowPayLater { get; set; }

        /// <summary>Permanent company portal link (course/date chosen in wizard).</summary>
        public bool IsCompanyPortalLink { get; set; }

        public string? CompanyName { get; set; }
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
        /// <summary>Formatted selected course date for display in email (e.g. "15 March 2025, 9:00 AM - 5:00 PM | Sefton").</summary>
        public string? CourseDateDisplay { get; set; }
    }

    public class CompanyCardPaymentResponseDto
    {
        public string TransactionId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Admin: list item for company orders (status, course count, etc.).
    /// </summary>
    public class AdminCompanyOrderListItemDto
    {
        public string OrderId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyEmail { get; set; } = string.Empty;
        public string? CompanyMobile { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int CourseCount { get; set; }
    }

    /// <summary>
    /// Admin: single company order with course/link details.
    /// </summary>
    public class AdminCompanyOrderDetailDto : AdminCompanyOrderListItemDto
    {
        public List<AdminCompanyOrderLinkItemDto> Links { get; set; } = new();
    }

    public class AdminCompanyOrderLinkItemDto
    {
        public string LinkId { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string FullUrl { get; set; } = string.Empty;
        public int UsedCount { get; set; }
        public int? MaxUses { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminCompanyOrderListResponseDto
    {
        public List<AdminCompanyOrderListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class OneTimeLinkCompleteResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    /// <summary>
    /// A student who enrolled via a specific enrollment link.
    /// </summary>
    public class EnrollmentLinkStudentDto
    {
        public string EnrollmentId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? CourseName { get; set; }
        public DateTime EnrolledAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public bool LlnAssessmentCompleted { get; set; }
        public bool EnrollmentFormCompleted { get; set; }
    }

    /// <summary>
    /// Response for the admin endpoint that returns all students who joined via a specific link.
    /// </summary>
    public class EnrollmentLinkStudentsResponseDto
    {
        public string LinkId { get; set; } = string.Empty;
        public string LinkName { get; set; } = string.Empty;
        public List<EnrollmentLinkStudentDto> Students { get; set; } = new();
    }
}

