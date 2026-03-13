namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Student
{
    public class StudentResponseDto
    {
        public Guid StudentId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? PreferredName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? PassportIdType { get; set; }
        public string? DocumentType { get; set; }
        public string? PassportIdNumber { get; set; }
        public string? PositionTitle { get; set; }
        public string? EmploymentType { get; set; }
        public DateTime? StartDate { get; set; }
        public string? CampusLocation { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Suburb { get; set; }
        public string? StateCode { get; set; }
        public string? Postcode { get; set; }
        public string? TeachingQualification { get; set; }
        public string? VocationalQualifications { get; set; }
        public DateTime? ComplianceExpiryDate { get; set; }
        public string? PoliceCheckStatus { get; set; }
        public string? RightToWork { get; set; }
        public string? Permissions { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int EnrollmentCount { get; set; }
    }
}
