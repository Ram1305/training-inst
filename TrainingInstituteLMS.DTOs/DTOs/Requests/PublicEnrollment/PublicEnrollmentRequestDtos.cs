namespace TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment
{
    public class PublicRegistrationRequestDto
    {
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string Phone { get; set; }
        public required string Password { get; set; }
    }
    
    public class PublicCourseEnrollmentRequestDto
    {
        public required Guid StudentId { get; set; }
        public required Guid CourseId { get; set; }
        public required Guid CourseDateId { get; set; }
        public required string PaymentMethod { get; set; } // bank_transfer, cash, card
    }
    
    public class CreateEnrollmentLinkRequestDto
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public Guid? CourseId { get; set; }
        public Guid? CourseDateId { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
    }
}
