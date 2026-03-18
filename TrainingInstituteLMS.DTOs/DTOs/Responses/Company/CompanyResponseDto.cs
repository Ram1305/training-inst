namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Company
{
    public class CompanyResponseDto
    {
        public Guid CompanyId { get; set; }
        public Guid UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
}
