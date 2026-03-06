using System;
using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment
{
    /// <summary>
    /// DTO for submitting or updating student enrollment form
    /// </summary>
    public class SubmitEnrollmentFormRequestDto
    {
        // =====================================================
        // SECTION 1 ù APPLICANT INFORMATION
        // =====================================================

        [Required]
        [MaxLength(10)]
        public string Title { get; set; } = string.Empty; // Mr, Mrs, Miss, Ms, Dr, Other

        [Required]
        [MaxLength(100)]
        public string Surname { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string GivenName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? MiddleName { get; set; }

        [MaxLength(100)]
        public string? PreferredName { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        [MaxLength(20)]
        public string Gender { get; set; } = string.Empty; // Male, Female

        [MaxLength(20)]
        public string? HomePhone { get; set; }

        [MaxLength(20)]
        public string? WorkPhone { get; set; }

        [Required]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        // Residential Address
        [Required]
        [MaxLength(500)]
        public string ResidentialAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ResidentialSuburb { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string ResidentialState { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string ResidentialPostcode { get; set; } = string.Empty;

        // Postal Address
        public bool PostalAddressDifferent { get; set; } = false;

        [MaxLength(500)]
        public string? PostalAddress { get; set; }

        [MaxLength(100)]
        public string? PostalSuburb { get; set; }

        [MaxLength(20)]
        public string? PostalState { get; set; }

        [MaxLength(10)]
        public string? PostalPostcode { get; set; }

        // Emergency Contact
        [MaxLength(200)]
        public string? EmergencyContactName { get; set; }

        [MaxLength(100)]
        public string? EmergencyContactRelationship { get; set; }

        [MaxLength(20)]
        public string? EmergencyContactNumber { get; set; }

        [Required]
        [MaxLength(10)]
        public string EmergencyPermission { get; set; } = string.Empty; // Yes, No

        // =====================================================
        // SECTION 2 ù UNIQUE STUDENT IDENTIFIER (USI)
        // =====================================================

        [MaxLength(10)]
        public string? USI { get; set; }

        public bool USIAccessPermission { get; set; } = false;

        [Required]
        [MaxLength(10)]
        public string USIApplyThroughSTA { get; set; } = string.Empty; // Yes, No

        [MaxLength(200)]
        public string? USIAuthoriseName { get; set; }

        public bool? USIConsent { get; set; }

        [MaxLength(100)]
        public string? TownCityOfBirth { get; set; }

        [MaxLength(100)]
        public string? OverseasCityOfBirth { get; set; }

        [MaxLength(10)]
        public string? USIIdType { get; set; } // 1-8

        // Driver's Licence Details (ID Type 1)
        [MaxLength(20)]
        public string? DriversLicenceState { get; set; }

        [MaxLength(50)]
        public string? DriversLicenceNumber { get; set; }

        // Medicare Details (ID Type 2)
        [MaxLength(20)]
        public string? MedicareNumber { get; set; }

        [MaxLength(10)]
        public string? MedicareIRN { get; set; }

        [MaxLength(10)]
        public string? MedicareCardColor { get; set; } // Green, Yellow, Blue

        public DateTime? MedicareExpiry { get; set; }

        // Birth Certificate (ID Type 3)
        [MaxLength(20)]
        public string? BirthCertificateState { get; set; }

        // ImmiCard (ID Type 4)
        [MaxLength(50)]
        public string? ImmiCardNumber { get; set; }

        // Australian Passport (ID Type 5)
        [MaxLength(50)]
        public string? AustralianPassportNumber { get; set; }

        // Non-Australian Passport (ID Type 6)
        [MaxLength(50)]
        public string? NonAustralianPassportNumber { get; set; }

        [MaxLength(100)]
        public string? NonAustralianPassportCountry { get; set; }

        // Citizenship Certificate (ID Type 7)
        [MaxLength(50)]
        public string? CitizenshipStockNumber { get; set; }

        public DateTime? CitizenshipAcquisitionDate { get; set; }

        // Registration by Descent (ID Type 8)
        public DateTime? DescentAcquisitionDate { get; set; }

        // =====================================================
        // SECTION 3 ù EDUCATION AND EMPLOYMENT INFORMATION
        // =====================================================

        [Required]
        [MaxLength(50)]
        public string SchoolLevel { get; set; } = string.Empty;

        [MaxLength(4)]
        public string? SchoolCompleteYear { get; set; }

        [Required]
        [MaxLength(200)]
        public string SchoolName { get; set; } = string.Empty;

        public bool SchoolInAustralia { get; set; } = true;

        [MaxLength(20)]
        public string? SchoolState { get; set; }

        [MaxLength(10)]
        public string? SchoolPostcode { get; set; }

        [MaxLength(100)]
        public string? SchoolCountry { get; set; }

        [Required]
        [MaxLength(10)]
        public string HasPostSecondaryQualification { get; set; } = string.Empty; // Yes, No

        public List<string>? QualificationLevels { get; set; }

        [MaxLength(1000)]
        public string? QualificationDetails { get; set; }

        [Required]
        [MaxLength(50)]
        public string EmploymentStatus { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? EmployerName { get; set; }

        [MaxLength(200)]
        public string? SupervisorName { get; set; }

        [MaxLength(500)]
        public string? EmployerAddress { get; set; }

        [MaxLength(255)]
        public string? EmployerEmail { get; set; }

        [MaxLength(20)]
        public string? EmployerPhone { get; set; }

        [Required]
        [MaxLength(50)]
        public string TrainingReason { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? TrainingReasonOther { get; set; }

        // =====================================================
        // SECTION 4 ù ADDITIONAL INFORMATION
        // =====================================================

        [Required]
        [MaxLength(100)]
        public string CountryOfBirth { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string SpeaksOtherLanguage { get; set; } = string.Empty; // Yes, No

        [MaxLength(100)]
        public string? HomeLanguage { get; set; }

        [Required]
        [MaxLength(100)]
        public string IndigenousStatus { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string HasDisability { get; set; } = string.Empty; // Yes, No

        public List<string>? DisabilityTypes { get; set; }

        [MaxLength(1000)]
        public string? DisabilityNotes { get; set; }

        // =====================================================
        // SECTION 5 ù PRIVACY NOTICE, TERMS & SIGNATURE
        // =====================================================

        [Required]
        public bool AcceptedPrivacyNotice { get; set; }

        [Required]
        public bool AcceptedTermsAndConditions { get; set; }

        [Required]
        [MaxLength(200)]
        public string DeclarationName { get; set; } = string.Empty;

        [Required]
        public DateTime DeclarationDate { get; set; }

        [Required]
        public string SignatureData { get; set; } = string.Empty; // Base64 encoded signature
    }
}
