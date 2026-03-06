using System;
using System.Collections.Generic;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment
{
    /// <summary>
    /// Complete enrollment form response DTO
    /// </summary>
    public class EnrollmentFormResponseDto
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // Form Status
        public bool EnrollmentFormCompleted { get; set; }
        public DateTime? EnrollmentFormSubmittedAt { get; set; }
        public string? EnrollmentFormStatus { get; set; } // Pending, Approved, Rejected
        public Guid? EnrollmentFormReviewedBy { get; set; }
        public string? ReviewedByName { get; set; }
        public DateTime? EnrollmentFormReviewedAt { get; set; }
        public string? EnrollmentFormReviewNotes { get; set; }

        // =====================================================
        // SECTION 1 — APPLICANT INFORMATION
        // =====================================================

        public string? Title { get; set; }
        public string? Surname { get; set; }
        public string? GivenName { get; set; }
        public string? MiddleName { get; set; }
        public string? PreferredName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? HomePhone { get; set; }
        public string? WorkPhone { get; set; }
        public string? Mobile { get; set; }

        // Residential Address
        public string? ResidentialAddress { get; set; }
        public string? ResidentialSuburb { get; set; }
        public string? ResidentialState { get; set; }
        public string? ResidentialPostcode { get; set; }

        // Postal Address
        public bool PostalAddressDifferent { get; set; }
        public string? PostalAddress { get; set; }
        public string? PostalSuburb { get; set; }
        public string? PostalState { get; set; }
        public string? PostalPostcode { get; set; }

        // Documents
        public string? PrimaryIdDocumentUrl { get; set; }
        public string? SecondaryIdDocumentUrl { get; set; }

        // Emergency Contact
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? EmergencyContactNumber { get; set; }
        public string? EmergencyPermission { get; set; }

        // =====================================================
        // SECTION 2 — UNIQUE STUDENT IDENTIFIER (USI)
        // =====================================================

        public string? USI { get; set; }
        public bool USIAccessPermission { get; set; }
        public string? USIApplyThroughSTA { get; set; }
        public string? USIAuthoriseName { get; set; }
        public bool USIConsent { get; set; }
        public string? TownCityOfBirth { get; set; }
        public string? OverseasCityOfBirth { get; set; }
        public string? USIIdType { get; set; }
        public string? USIIdDocumentUrl { get; set; }

        // Driver's Licence Details
        public string? DriversLicenceState { get; set; }
        public string? DriversLicenceNumber { get; set; }

        // Medicare Details
        public string? MedicareNumber { get; set; }
        public string? MedicareIRN { get; set; }
        public string? MedicareCardColor { get; set; }
        public DateTime? MedicareExpiry { get; set; }

        // Birth Certificate
        public string? BirthCertificateState { get; set; }

        // ImmiCard
        public string? ImmiCardNumber { get; set; }

        // Australian Passport
        public string? AustralianPassportNumber { get; set; }

        // Non-Australian Passport
        public string? NonAustralianPassportNumber { get; set; }
        public string? NonAustralianPassportCountry { get; set; }

        // Citizenship Certificate
        public string? CitizenshipStockNumber { get; set; }
        public DateTime? CitizenshipAcquisitionDate { get; set; }

        // Registration by Descent
        public DateTime? DescentAcquisitionDate { get; set; }

        // =====================================================
        // SECTION 3 — EDUCATION AND EMPLOYMENT INFORMATION
        // =====================================================

        public string? SchoolLevel { get; set; }
        public string? SchoolCompleteYear { get; set; }
        public string? SchoolName { get; set; }
        public bool SchoolInAustralia { get; set; }
        public string? SchoolState { get; set; }
        public string? SchoolPostcode { get; set; }
        public string? SchoolCountry { get; set; }
        public string? HasPostSecondaryQualification { get; set; }
        public List<string>? QualificationLevels { get; set; }
        public string? QualificationDetails { get; set; }
        public string? QualificationEvidenceUrl { get; set; }
        public string? EmploymentStatus { get; set; }
        public string? EmployerName { get; set; }
        public string? SupervisorName { get; set; }
        public string? EmployerAddress { get; set; }
        public string? EmployerEmail { get; set; }
        public string? EmployerPhone { get; set; }
        public string? TrainingReason { get; set; }
        public string? TrainingReasonOther { get; set; }

        // =====================================================
        // SECTION 4 — ADDITIONAL INFORMATION
        // =====================================================

        public string? CountryOfBirth { get; set; }
        public string? SpeaksOtherLanguage { get; set; }
        public string? HomeLanguage { get; set; }
        public string? IndigenousStatus { get; set; }
        public string? HasDisability { get; set; }
        public List<string>? DisabilityTypes { get; set; }
        public string? DisabilityNotes { get; set; }

        // =====================================================
        // SECTION 5 — PRIVACY NOTICE, TERMS & SIGNATURE
        // =====================================================

        public bool AcceptedPrivacyNotice { get; set; }
        public bool AcceptedTermsAndConditions { get; set; }
        public string? DeclarationName { get; set; }
        public DateTime? DeclarationDate { get; set; }
        public string? SignatureData { get; set; }
    }
}
