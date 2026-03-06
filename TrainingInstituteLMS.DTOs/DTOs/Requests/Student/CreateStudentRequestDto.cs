using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Student
{
    public class CreateStudentRequestDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 200 characters")]
        public string FullName { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Preferred name cannot exceed 100 characters")]
        public string? PreferredName { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        [StringLength(50, ErrorMessage = "Passport/ID type cannot exceed 50 characters")]
        public string? PassportIdType { get; set; }

        [StringLength(50, ErrorMessage = "Document type cannot exceed 50 characters")]
        public string? DocumentType { get; set; }

        [StringLength(100, ErrorMessage = "Passport/ID number cannot exceed 100 characters")]
        public string? PassportIdNumber { get; set; }

        [StringLength(150, ErrorMessage = "Position title cannot exceed 150 characters")]
        public string? PositionTitle { get; set; }

        [StringLength(50, ErrorMessage = "Employment type cannot exceed 50 characters")]
        public string? EmploymentType { get; set; }

        public DateTime? StartDate { get; set; }

        [StringLength(150, ErrorMessage = "Campus location cannot exceed 150 characters")]
        public string? CampusLocation { get; set; }

        [StringLength(255, ErrorMessage = "Address line 1 cannot exceed 255 characters")]
        public string? AddressLine1 { get; set; }

        [StringLength(255, ErrorMessage = "Address line 2 cannot exceed 255 characters")]
        public string? AddressLine2 { get; set; }

        [StringLength(100, ErrorMessage = "Suburb cannot exceed 100 characters")]
        public string? Suburb { get; set; }

        [StringLength(10, ErrorMessage = "State code cannot exceed 10 characters")]
        public string? StateCode { get; set; }

        [StringLength(10, ErrorMessage = "Postcode cannot exceed 10 characters")]
        public string? Postcode { get; set; }

        [StringLength(500, ErrorMessage = "Teaching qualification cannot exceed 500 characters")]
        public string? TeachingQualification { get; set; }

        [StringLength(500, ErrorMessage = "Vocational qualifications cannot exceed 500 characters")]
        public string? VocationalQualifications { get; set; }

        public DateTime? ComplianceExpiryDate { get; set; }

        [StringLength(50, ErrorMessage = "Police check status cannot exceed 50 characters")]
        public string? PoliceCheckStatus { get; set; }

        [StringLength(50, ErrorMessage = "Right to work cannot exceed 50 characters")]
        public string? RightToWork { get; set; }

        [StringLength(500, ErrorMessage = "Permissions cannot exceed 500 characters")]
        public string? Permissions { get; set; }
    }
}
