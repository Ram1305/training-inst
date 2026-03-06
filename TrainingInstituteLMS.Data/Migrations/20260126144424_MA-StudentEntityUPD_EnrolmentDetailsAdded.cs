using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class MAStudentEntityUPD_EnrolmentDetailsAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AcceptedPrivacyNotice",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptedTermsAndConditions",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AustralianPassportNumber",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BirthCertificateState",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CitizenshipAcquisitionDate",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CitizenshipStockNumber",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountryOfBirth",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeclarationDate",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeclarationName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DescentAcquisitionDate",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisabilityNotes",
                table: "Students",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisabilityTypes",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriversLicenceNumber",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriversLicenceState",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactNumber",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactRelationship",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyPermission",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployerAddress",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployerEmail",
                table: "Students",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployerName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployerPhone",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmploymentStatus",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnrollmentFormCompleted",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EnrollmentFormReviewNotes",
                table: "Students",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EnrollmentFormReviewedAt",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EnrollmentFormReviewedBy",
                table: "Students",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnrollmentFormStatus",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EnrollmentFormSubmittedAt",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GivenName",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HasDisability",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HasPostSecondaryQualification",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomeLanguage",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomePhone",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImmiCardNumber",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndigenousStatus",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicareCardColor",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MedicareExpiry",
                table: "Students",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicareIRN",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicareNumber",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MiddleName",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mobile",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NonAustralianPassportCountry",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NonAustralianPassportNumber",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OverseasCityOfBirth",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalAddress",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PostalAddressDifferent",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PostalPostcode",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalState",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalSuburb",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryIdDocumentUrl",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationDetails",
                table: "Students",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationEvidenceUrl",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationLevels",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResidentialAddress",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResidentialPostcode",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResidentialState",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResidentialSuburb",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchoolCompleteYear",
                table: "Students",
                type: "nvarchar(4)",
                maxLength: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchoolCountry",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SchoolInAustralia",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SchoolLevel",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchoolName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchoolPostcode",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchoolState",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryIdDocumentUrl",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignatureData",
                table: "Students",
                type: "nvarchar(max)",
                maxLength: 100000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpeaksOtherLanguage",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupervisorName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Surname",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TownCityOfBirth",
                table: "Students",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrainingReason",
                table: "Students",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrainingReasonOther",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "USI",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "USIAccessPermission",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "USIApplyThroughSTA",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "USIAuthoriseName",
                table: "Students",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "USIConsent",
                table: "Students",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "USIIdDocumentUrl",
                table: "Students",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "USIIdType",
                table: "Students",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkPhone",
                table: "Students",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedPrivacyNotice",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "AcceptedTermsAndConditions",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "AustralianPassportNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "BirthCertificateState",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CitizenshipAcquisitionDate",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CitizenshipStockNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CountryOfBirth",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DeclarationDate",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DeclarationName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DescentAcquisitionDate",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DisabilityNotes",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DisabilityTypes",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DriversLicenceNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "DriversLicenceState",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmergencyContactNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmergencyContactRelationship",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmergencyPermission",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmployerAddress",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmployerEmail",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmployerName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmployerPhone",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EmploymentStatus",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormCompleted",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormReviewNotes",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormReviewedAt",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormReviewedBy",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormStatus",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EnrollmentFormSubmittedAt",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "GivenName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "HasDisability",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "HasPostSecondaryQualification",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "HomeLanguage",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "HomePhone",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ImmiCardNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "IndigenousStatus",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "MedicareCardColor",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "MedicareExpiry",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "MedicareIRN",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "MedicareNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "MiddleName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Mobile",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "NonAustralianPassportCountry",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "NonAustralianPassportNumber",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "OverseasCityOfBirth",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PostalAddress",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PostalAddressDifferent",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PostalPostcode",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PostalState",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PostalSuburb",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PrimaryIdDocumentUrl",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "QualificationDetails",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "QualificationEvidenceUrl",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "QualificationLevels",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ResidentialAddress",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ResidentialPostcode",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ResidentialState",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ResidentialSuburb",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolCompleteYear",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolCountry",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolInAustralia",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolLevel",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolPostcode",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SchoolState",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SecondaryIdDocumentUrl",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SignatureData",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SpeaksOtherLanguage",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "SupervisorName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Surname",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "TownCityOfBirth",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "TrainingReason",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "TrainingReasonOther",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USI",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIAccessPermission",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIApplyThroughSTA",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIAuthoriseName",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIConsent",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIIdDocumentUrl",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "USIIdType",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "WorkPhone",
                table: "Students");
        }
    }
}
