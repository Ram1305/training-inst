using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.Data.Entities.Quiz;

namespace TrainingInstituteLMS.Data.Entities.Students
{
    public class Student
    {
        [Key]
        public Guid StudentId { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? PreferredName { get; set; }

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // =====================================================
        // SECTION 1 — APPLICANT INFORMATION
        // =====================================================

        [MaxLength(10)]
        public string? Title { get; set; } // Mr, Mrs, Miss, Ms, Dr, Other

        [MaxLength(100)]
        public string? Surname { get; set; }

        [MaxLength(100)]
        public string? GivenName { get; set; }

        [MaxLength(100)]
        public string? MiddleName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(20)]
        public string? Gender { get; set; } // Male, Female

        [MaxLength(20)]
        public string? HomePhone { get; set; }

        [MaxLength(20)]
        public string? WorkPhone { get; set; }

        [MaxLength(20)]
        public string? Mobile { get; set; }

        // Residential Address
        [MaxLength(500)]
        public string? ResidentialAddress { get; set; }

        [MaxLength(100)]
        public string? ResidentialSuburb { get; set; }

        [MaxLength(20)]
        public string? ResidentialState { get; set; }

        [MaxLength(10)]
        public string? ResidentialPostcode { get; set; }

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

        // Documents (file URLs)
        [MaxLength(500)]
        public string? PrimaryIdDocumentUrl { get; set; }

        [MaxLength(500)]
        public string? SecondaryIdDocumentUrl { get; set; }

        // Emergency Contact
        [MaxLength(200)]
        public string? EmergencyContactName { get; set; }

        [MaxLength(100)]
        public string? EmergencyContactRelationship { get; set; }

        [MaxLength(20)]
        public string? EmergencyContactNumber { get; set; }

        [MaxLength(10)]
        public string? EmergencyPermission { get; set; } // Yes, No

        // =====================================================
        // SECTION 2 — UNIQUE STUDENT IDENTIFIER (USI)
        // =====================================================

        [MaxLength(10)]
        public string? USI { get; set; }

        public bool USIAccessPermission { get; set; } = false;

        [MaxLength(10)]
        public string? USIApplyThroughSTA { get; set; } // Yes, No

        [MaxLength(200)]
        public string? USIAuthoriseName { get; set; }

        public bool USIConsent { get; set; } = false;

        [MaxLength(100)]
        public string? TownCityOfBirth { get; set; }

        [MaxLength(100)]
        public string? OverseasCityOfBirth { get; set; }

        [MaxLength(10)]
        public string? USIIdType { get; set; } // 1-8

        [MaxLength(500)]
        public string? USIIdDocumentUrl { get; set; }

        // Driver's Licence Details
        [MaxLength(20)]
        public string? DriversLicenceState { get; set; }

        [MaxLength(50)]
        public string? DriversLicenceNumber { get; set; }

        // Medicare Details
        [MaxLength(20)]
        public string? MedicareNumber { get; set; }

        [MaxLength(10)]
        public string? MedicareIRN { get; set; }

        [MaxLength(10)]
        public string? MedicareCardColor { get; set; } // Green, Yellow, Blue

        public DateTime? MedicareExpiry { get; set; }

        // Birth Certificate
        [MaxLength(20)]
        public string? BirthCertificateState { get; set; }

        // ImmiCard
        [MaxLength(50)]
        public string? ImmiCardNumber { get; set; }

        // Australian Passport
        [MaxLength(50)]
        public string? AustralianPassportNumber { get; set; }

        // Non-Australian Passport
        [MaxLength(50)]
        public string? NonAustralianPassportNumber { get; set; }

        [MaxLength(100)]
        public string? NonAustralianPassportCountry { get; set; }

        // Citizenship Certificate
        [MaxLength(50)]
        public string? CitizenshipStockNumber { get; set; }

        public DateTime? CitizenshipAcquisitionDate { get; set; }

        // Registration by Descent
        public DateTime? DescentAcquisitionDate { get; set; }

        // =====================================================
        // SECTION 3 — EDUCATION AND EMPLOYMENT INFORMATION
        // =====================================================

        [MaxLength(50)]
        public string? SchoolLevel { get; set; }

        [MaxLength(4)]
        public string? SchoolCompleteYear { get; set; }

        [MaxLength(200)]
        public string? SchoolName { get; set; }

        public bool SchoolInAustralia { get; set; } = true;

        [MaxLength(20)]
        public string? SchoolState { get; set; }

        [MaxLength(10)]
        public string? SchoolPostcode { get; set; }

        [MaxLength(100)]
        public string? SchoolCountry { get; set; }

        [MaxLength(10)]
        public string? HasPostSecondaryQualification { get; set; } // Yes, No

        [MaxLength(500)]
        public string? QualificationLevels { get; set; } // JSON array or comma-separated

        [MaxLength(1000)]
        public string? QualificationDetails { get; set; }

        [MaxLength(500)]
        public string? QualificationEvidenceUrl { get; set; }

        [MaxLength(50)]
        public string? EmploymentStatus { get; set; }

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

        [MaxLength(50)]
        public string? TrainingReason { get; set; }

        [MaxLength(500)]
        public string? TrainingReasonOther { get; set; }

        // =====================================================
        // SECTION 4 — ADDITIONAL INFORMATION
        // =====================================================

        [MaxLength(100)]
        public string? CountryOfBirth { get; set; }

        [MaxLength(10)]
        public string? SpeaksOtherLanguage { get; set; } // Yes, No

        [MaxLength(100)]
        public string? HomeLanguage { get; set; }

        [MaxLength(100)]
        public string? IndigenousStatus { get; set; }

        [MaxLength(10)]
        public string? HasDisability { get; set; } // Yes, No

        [MaxLength(500)]
        public string? DisabilityTypes { get; set; } // JSON array or comma-separated

        [MaxLength(1000)]
        public string? DisabilityNotes { get; set; }

        // =====================================================
        // SECTION 5 — PRIVACY NOTICE, TERMS & SIGNATURE
        // =====================================================

        public bool AcceptedPrivacyNotice { get; set; } = false;

        public bool AcceptedTermsAndConditions { get; set; } = false;

        [MaxLength(200)]
        public string? DeclarationName { get; set; }

        public DateTime? DeclarationDate { get; set; }

        [MaxLength(100000)]
        public string? SignatureData { get; set; } // Base64 encoded signature

        // =====================================================
        // ENROLLMENT FORM STATUS
        // =====================================================

        public bool EnrollmentFormCompleted { get; set; } = false;

        public DateTime? EnrollmentFormSubmittedAt { get; set; }

        [MaxLength(50)]
        public string? EnrollmentFormStatus { get; set; } // Pending, Approved, Rejected

        public Guid? EnrollmentFormReviewedBy { get; set; }

        public DateTime? EnrollmentFormReviewedAt { get; set; }

        [MaxLength(1000)]
        public string? EnrollmentFormReviewNotes { get; set; }

        // =====================================================
        // Legacy Fields (keeping for backward compatibility)
        // =====================================================

        [MaxLength(50)]
        public string? PassportIdType { get; set; }

        [MaxLength(50)]
        public string? DocumentType { get; set; }

        [MaxLength(100)]
        public string? PassportIdNumber { get; set; }

        [MaxLength(150)]
        public string? PositionTitle { get; set; }

        [MaxLength(50)]
        public string? EmploymentType { get; set; }

        public DateTime? StartDate { get; set; }

        [MaxLength(150)]
        public string? CampusLocation { get; set; }

        [MaxLength(255)]
        public string? AddressLine1 { get; set; }

        [MaxLength(255)]
        public string? AddressLine2 { get; set; }

        [MaxLength(100)]
        public string? Suburb { get; set; }

        [MaxLength(10)]
        public string? StateCode { get; set; }

        [MaxLength(10)]
        public string? Postcode { get; set; }

        [MaxLength(500)]
        public string? TeachingQualification { get; set; }

        [MaxLength(500)]
        public string? VocationalQualifications { get; set; }

        public DateTime? ComplianceExpiryDate { get; set; }

        [MaxLength(50)]
        public string? PoliceCheckStatus { get; set; }

        [MaxLength(50)]
        public string? RightToWork { get; set; }

        [MaxLength(500)]
        public string? Permissions { get; set; }

        // Navigation Properties
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        public virtual ICollection<PreEnrollmentQuizAttempt> QuizAttempts { get; set; } = new List<PreEnrollmentQuizAttempt>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
