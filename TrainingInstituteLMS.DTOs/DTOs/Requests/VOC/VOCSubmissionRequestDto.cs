using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.VOC
{
    public class VOCSubmissionRequestDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Australian Student ID is required")]
        [StringLength(50, ErrorMessage = "Student ID cannot exceed 50 characters")]
        public string AustralianStudentId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Street address is required")]
        [StringLength(255, ErrorMessage = "Street address cannot exceed 255 characters")]
        public string StreetAddress { get; set; } = string.Empty;

        [Required(ErrorMessage = "City is required")]
        [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required")]
        [StringLength(50, ErrorMessage = "State cannot exceed 50 characters")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "Postcode is required")]
        [StringLength(10, ErrorMessage = "Postcode cannot exceed 10 characters")]
        public string Postcode { get; set; } = string.Empty;

        public DateTime? PreferredStartDate { get; set; }

        [StringLength(50, ErrorMessage = "Preferred time cannot exceed 50 characters")]
        public string? PreferredTime { get; set; }

        public string? Comments { get; set; }
    }

    public class VOCStatusUpdateRequestDto
    {
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;
    }
}
