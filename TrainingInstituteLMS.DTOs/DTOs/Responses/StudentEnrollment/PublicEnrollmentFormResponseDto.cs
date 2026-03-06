namespace TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment
{
    public class PublicEnrollmentFormResponseDto
    {
        public Guid UserId { get; set; }
        public Guid StudentId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string EnrollmentFormStatus { get; set; } = string.Empty;
    }
}
