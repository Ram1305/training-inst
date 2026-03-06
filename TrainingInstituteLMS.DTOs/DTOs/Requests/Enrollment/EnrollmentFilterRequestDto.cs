namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment
{
    public class EnrollmentFilterRequestDto
    {
        public Guid? StudentId { get; set; }
        public Guid? CourseId { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SearchQuery { get; set; }
        public string SortBy { get; set; } = "enrolledat";
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
