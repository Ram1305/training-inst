namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class EnrollmentListResponseDto
    {
        public List<EnrollmentResponseDto> Enrollments { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
