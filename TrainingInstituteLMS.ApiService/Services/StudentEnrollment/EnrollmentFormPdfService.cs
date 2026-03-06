using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;

namespace TrainingInstituteLMS.ApiService.Services.StudentEnrollment
{
    public interface IEnrollmentFormPdfService
    {
        Task<byte[]> GenerateEnrollmentFormPdfAsync(Guid studentId);
        Task<string> GenerateEnrollmentFormHtmlAsync(Guid studentId);
    }

    public class EnrollmentFormPdfService : IEnrollmentFormPdfService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<EnrollmentFormPdfService> _logger;

        public EnrollmentFormPdfService(
            TrainingLMSDbContext context,
            IFileStorageService fileStorageService,
            ILogger<EnrollmentFormPdfService> logger)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<byte[]> GenerateEnrollmentFormPdfAsync(Guid studentId)
        {
            // Generate HTML and convert to PDF using a library like iTextSharp or Puppeteer
            // For now, we'll return the HTML content that can be printed to PDF client-side
            var html = await GenerateEnrollmentFormHtmlAsync(studentId);
            
            // Convert HTML to PDF bytes
            // Using a simple approach - in production, you might use Puppeteer, iTextSharp, or a service
            return System.Text.Encoding.UTF8.GetBytes(html);
        }

        public async Task<string> GenerateEnrollmentFormHtmlAsync(Guid studentId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.StudentId == studentId);

            if (student == null)
                throw new ArgumentException("Student not found");

            // Get enrollment info
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.CourseDate)
                .Where(e => e.StudentId == studentId)
                .OrderByDescending(e => e.EnrolledAt)
                .FirstOrDefaultAsync();

            var courseName = enrollment?.Course?.CourseName ?? "Not Enrolled";
            var courseCode = enrollment?.Course?.CourseCode ?? "";
            var courseDate = enrollment?.CourseDate?.ScheduledDate.ToString("dd/MM/yyyy") ?? "";

            var html = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Enrollment Form - {EscapeHtml(student.FullName)}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #6366f1;
        }}
        .header h1 {{
            color: #6366f1;
            font-size: 24px;
            margin-bottom: 5px;
        }}
        .header p {{
            color: #666;
            font-size: 12px;
        }}
        .section {{
            margin-bottom: 20px;
            page-break-inside: avoid;
        }}
        .section-title {{
            background: linear-gradient(to right, #6366f1, #8b5cf6);
            color: white;
            padding: 8px 15px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-radius: 4px;
        }}
        .form-row {{
            display: flex;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }}
        .form-group {{
            flex: 1;
            min-width: 200px;
            margin-right: 15px;
            margin-bottom: 8px;
        }}
        .form-group:last-child {{
            margin-right: 0;
        }}
        .form-label {{
            font-weight: bold;
            color: #555;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 3px;
            display: block;
        }}
        .form-value {{
            padding: 6px 10px;
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            min-height: 28px;
        }}
        .form-value.empty {{
            color: #999;
            font-style: italic;
        }}
        .two-col {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }}
        .three-col {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
        }}
        .four-col {{
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
        }}
        .full-width {{
            grid-column: 1 / -1;
        }}
        .signature-box {{
            border: 1px solid #ccc;
            padding: 10px;
            min-height: 60px;
            background: #fafafa;
            text-align: center;
        }}
        .signature-box img {{
            max-height: 50px;
        }}
        .footer {{
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }}
        .status-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
        }}
        .status-pending {{
            background: #fef3c7;
            color: #92400e;
        }}
        .status-approved {{
            background: #d1fae5;
            color: #065f46;
        }}
        .status-rejected {{
            background: #fee2e2;
            color: #991b1b;
        }}
        .course-info {{
            background: #f0f4ff;
            border: 1px solid #c7d2fe;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
        }}
        .course-info h3 {{
            color: #4338ca;
            margin-bottom: 5px;
        }}
        @media print {{
            body {{
                padding: 0;
            }}
            .section {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
    <div class=""header"">
        <h1>Student Enrollment Form</h1>
        <p>AIET College - Training Institute</p>
        <p style=""margin-top: 10px;"">
            <span class=""status-badge status-{(student.EnrollmentFormStatus ?? "pending").ToLower()}"">{student.EnrollmentFormStatus ?? "Pending"}</span>
        </p>
    </div>

    <!-- Course Information -->
    <div class=""course-info"">
        <h3>{EscapeHtml(courseName)}</h3>
        <p><strong>Course Code:</strong> {EscapeHtml(courseCode)} &nbsp; | &nbsp; <strong>Start Date:</strong> {courseDate}</p>
    </div>

    <!-- Section 1: Applicant Information -->
    <div class=""section"">
        <div class=""section-title"">Section 1: Applicant Information</div>
        
        <div class=""four-col"">
            <div class=""form-group"">
                <span class=""form-label"">Title</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.Title) ? "empty" : "")}"">{EscapeHtml(student.Title) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Surname</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.Surname) ? "empty" : "")}"">{EscapeHtml(student.Surname) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Given Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.GivenName) ? "empty" : "")}"">{EscapeHtml(student.GivenName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Middle Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.MiddleName) ? "empty" : "")}"">{EscapeHtml(student.MiddleName) ?? "-"}</div>
            </div>
        </div>

        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Preferred Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.PreferredName) ? "empty" : "")}"">{EscapeHtml(student.PreferredName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Date of Birth</span>
                <div class=""form-value"">{student.DateOfBirth?.ToString("dd/MM/yyyy") ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Gender</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.Gender) ? "empty" : "")}"">{EscapeHtml(student.Gender) ?? "-"}</div>
            </div>
        </div>

        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Home Phone</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.HomePhone) ? "empty" : "")}"">{EscapeHtml(student.HomePhone) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Work Phone</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.WorkPhone) ? "empty" : "")}"">{EscapeHtml(student.WorkPhone) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Mobile</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.Mobile) ? "empty" : "")}"">{EscapeHtml(student.Mobile ?? student.PhoneNumber) ?? "-"}</div>
            </div>
        </div>

        <div class=""form-group full-width"">
            <span class=""form-label"">Email</span>
            <div class=""form-value"">{EscapeHtml(student.Email)}</div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Residential Address</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.ResidentialAddress) ? "empty" : "")}"">{EscapeHtml(student.ResidentialAddress) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Suburb</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.ResidentialSuburb) ? "empty" : "")}"">{EscapeHtml(student.ResidentialSuburb) ?? "-"}</div>
            </div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">State</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.ResidentialState) ? "empty" : "")}"">{EscapeHtml(student.ResidentialState) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Postcode</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.ResidentialPostcode) ? "empty" : "")}"">{EscapeHtml(student.ResidentialPostcode) ?? "-"}</div>
            </div>
        </div>

        {(student.PostalAddressDifferent ? $@"
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Postal Address</span>
                <div class=""form-value"">{EscapeHtml(student.PostalAddress) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Postal Suburb</span>
                <div class=""form-value"">{EscapeHtml(student.PostalSuburb) ?? "-"}</div>
            </div>
        </div>
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Postal State</span>
                <div class=""form-value"">{EscapeHtml(student.PostalState) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Postal Postcode</span>
                <div class=""form-value"">{EscapeHtml(student.PostalPostcode) ?? "-"}</div>
            </div>
        </div>
        " : "")}

        <div class=""section-title"" style=""background: #64748b; margin-top: 15px;"">Emergency Contact</div>
        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Contact Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmergencyContactName) ? "empty" : "")}"">{EscapeHtml(student.EmergencyContactName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Relationship</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmergencyContactRelationship) ? "empty" : "")}"">{EscapeHtml(student.EmergencyContactRelationship) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Contact Number</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmergencyContactNumber) ? "empty" : "")}"">{EscapeHtml(student.EmergencyContactNumber) ?? "-"}</div>
            </div>
        </div>
        <div class=""form-group"">
            <span class=""form-label"">Emergency Permission</span>
            <div class=""form-value {(string.IsNullOrEmpty(student.EmergencyPermission) ? "empty" : "")}"">{EscapeHtml(student.EmergencyPermission) ?? "-"}</div>
        </div>

        <div class=""section-title"" style=""background: #64748b; margin-top: 15px;"">Identity Documents</div>
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Primary ID Document</span>
                <div class=""form-value"">{(string.IsNullOrEmpty(student.PrimaryIdDocumentUrl) ? "<span style='color: #999;'>Not uploaded</span>" : $"<a href='{GetDocumentUrl(student.PrimaryIdDocumentUrl)}' target='_blank'>View Document</a>")}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Secondary ID Document</span>
                <div class=""form-value"">{(string.IsNullOrEmpty(student.SecondaryIdDocumentUrl) ? "<span style='color: #999;'>Not uploaded</span>" : $"<a href='{GetDocumentUrl(student.SecondaryIdDocumentUrl)}' target='_blank'>View Document</a>")}</div>
            </div>
        </div>
    </div>

    <!-- Section 2: USI Information -->
    <div class=""section"">
        <div class=""section-title"">Section 2: Unique Student Identifier (USI)</div>
        
        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">USI Number</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.USI) ? "empty" : "")}"">{EscapeHtml(student.USI) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">USI Access Permission</span>
                <div class=""form-value"">{(student.USIAccessPermission ? "Yes" : "No")}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Apply Through STA</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.USIApplyThroughSTA) ? "empty" : "")}"">{EscapeHtml(student.USIApplyThroughSTA) ?? "-"}</div>
            </div>
        </div>

        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">USI Authorise Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.USIAuthoriseName) ? "empty" : "")}"">{EscapeHtml(student.USIAuthoriseName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">USI Consent</span>
                <div class=""form-value"">{(student.USIConsent ? "Yes" : "No")}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">USI ID Document</span>
                <div class=""form-value"">{(string.IsNullOrEmpty(student.USIIdDocumentUrl) ? "<span style='color: #999;'>Not uploaded</span>" : $"<a href='{GetDocumentUrl(student.USIIdDocumentUrl)}' target='_blank'>View Document</a>")}</div>
            </div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Town/City of Birth</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.TownCityOfBirth) ? "empty" : "")}"">{EscapeHtml(student.TownCityOfBirth) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Overseas City of Birth</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.OverseasCityOfBirth) ? "empty" : "")}"">{EscapeHtml(student.OverseasCityOfBirth) ?? "-"}</div>
            </div>
        </div>

        <div class=""form-group"">
            <span class=""form-label"">USI ID Type</span>
            <div class=""form-value {(string.IsNullOrEmpty(student.USIIdType) ? "empty" : "")}"">{EscapeHtml(student.USIIdType) ?? "-"}</div>
        </div>

        {(!string.IsNullOrEmpty(student.DriversLicenceNumber) ? $@"
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Driver's Licence State</span>
                <div class=""form-value"">{EscapeHtml(student.DriversLicenceState) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Driver's Licence Number</span>
                <div class=""form-value"">{EscapeHtml(student.DriversLicenceNumber)}</div>
            </div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.MedicareNumber) ? $@"
        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Medicare Number</span>
                <div class=""form-value"">{EscapeHtml(student.MedicareNumber)}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Medicare IRN</span>
                <div class=""form-value"">{EscapeHtml(student.MedicareIRN) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Medicare Card Color</span>
                <div class=""form-value"">{EscapeHtml(student.MedicareCardColor) ?? "-"}</div>
            </div>
        </div>
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Medicare Expiry</span>
                <div class=""form-value"">{student.MedicareExpiry?.ToString("MM/yyyy") ?? "-"}</div>
            </div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.BirthCertificateState) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Birth Certificate State</span>
            <div class=""form-value"">{EscapeHtml(student.BirthCertificateState)}</div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.ImmiCardNumber) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">ImmiCard Number</span>
            <div class=""form-value"">{EscapeHtml(student.ImmiCardNumber)}</div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.AustralianPassportNumber) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Australian Passport Number</span>
            <div class=""form-value"">{EscapeHtml(student.AustralianPassportNumber)}</div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.NonAustralianPassportNumber) ? $@"
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Non-Australian Passport Number</span>
                <div class=""form-value"">{EscapeHtml(student.NonAustralianPassportNumber)}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Passport Country</span>
                <div class=""form-value"">{EscapeHtml(student.NonAustralianPassportCountry) ?? "-"}</div>
            </div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.CitizenshipStockNumber) ? $@"
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Citizenship Stock Number</span>
                <div class=""form-value"">{EscapeHtml(student.CitizenshipStockNumber)}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Citizenship Acquisition Date</span>
                <div class=""form-value"">{student.CitizenshipAcquisitionDate?.ToString("dd/MM/yyyy") ?? "-"}</div>
            </div>
        </div>
        " : "")}

        {(student.DescentAcquisitionDate.HasValue ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Registration by Descent Acquisition Date</span>
            <div class=""form-value"">{student.DescentAcquisitionDate?.ToString("dd/MM/yyyy") ?? "-"}</div>
        </div>
        " : "")}
    </div>

    <!-- Section 3: Education and Employment -->
    <div class=""section"">
        <div class=""section-title"">Section 3: Education and Employment Information</div>
        
        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Highest School Level</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SchoolLevel) ? "empty" : "")}"">{EscapeHtml(student.SchoolLevel) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Year Completed</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SchoolCompleteYear) ? "empty" : "")}"">{EscapeHtml(student.SchoolCompleteYear) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">School In Australia</span>
                <div class=""form-value"">{(student.SchoolInAustralia ? "Yes" : "No")}</div>
            </div>
        </div>

        <div class=""form-group"">
            <span class=""form-label"">School Name</span>
            <div class=""form-value {(string.IsNullOrEmpty(student.SchoolName) ? "empty" : "")}"">{EscapeHtml(student.SchoolName) ?? "-"}</div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">School State</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SchoolState) ? "empty" : "")}"">{EscapeHtml(student.SchoolState) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">School Postcode</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SchoolPostcode) ? "empty" : "")}"">{EscapeHtml(student.SchoolPostcode) ?? "-"}</div>
            </div>
        </div>

        <div class=""form-group"">
            <span class=""form-label"">School Country</span>
            <div class=""form-value {(string.IsNullOrEmpty(student.SchoolCountry) ? "empty" : "")}"">{EscapeHtml(student.SchoolCountry) ?? "-"}</div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Has Post-Secondary Qualification</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.HasPostSecondaryQualification) ? "empty" : "")}"">{EscapeHtml(student.HasPostSecondaryQualification) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Qualification Evidence</span>
                <div class=""form-value"">{(string.IsNullOrEmpty(student.QualificationEvidenceUrl) ? "<span style='color: #999;'>Not uploaded</span>" : $"<a href='{GetDocumentUrl(student.QualificationEvidenceUrl)}' target='_blank'>View Document</a>")}</div>
            </div>
        </div>

        {(!string.IsNullOrEmpty(student.QualificationLevels) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Qualification Levels</span>
            <div class=""form-value"">{EscapeHtml(FormatList(student.QualificationLevels))}</div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.QualificationDetails) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Qualification Details</span>
            <div class=""form-value"">{EscapeHtml(student.QualificationDetails)}</div>
        </div>
        " : "")}

        <div class=""section-title"" style=""background: #64748b; margin-top: 15px;"">Employment</div>
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Employment Status</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmploymentStatus) ? "empty" : "")}"">{EscapeHtml(student.EmploymentStatus) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Employer Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmployerName) ? "empty" : "")}"">{EscapeHtml(student.EmployerName) ?? "-"}</div>
            </div>
        </div>

        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Supervisor Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SupervisorName) ? "empty" : "")}"">{EscapeHtml(student.SupervisorName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Employer Phone</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmployerPhone) ? "empty" : "")}"">{EscapeHtml(student.EmployerPhone) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Employer Email</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.EmployerEmail) ? "empty" : "")}"">{EscapeHtml(student.EmployerEmail) ?? "-"}</div>
            </div>
        </div>

        <div class=""form-group"">
            <span class=""form-label"">Employer Address</span>
            <div class=""form-value {(string.IsNullOrEmpty(student.EmployerAddress) ? "empty" : "")}"">{EscapeHtml(student.EmployerAddress) ?? "-"}</div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Reason for Training</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.TrainingReason) ? "empty" : "")}"">{EscapeHtml(student.TrainingReason) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Training Reason (Other)</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.TrainingReasonOther) ? "empty" : "")}"">{EscapeHtml(student.TrainingReasonOther) ?? "-"}</div>
            </div>
        </div>
    </div>

    <!-- Section 4: Additional Information -->
    <div class=""section"">
        <div class=""section-title"">Section 4: Additional Information</div>
        
        <div class=""three-col"">
            <div class=""form-group"">
                <span class=""form-label"">Country of Birth</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.CountryOfBirth) ? "empty" : "")}"">{EscapeHtml(student.CountryOfBirth) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Speaks Other Language at Home</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.SpeaksOtherLanguage) ? "empty" : "")}"">{EscapeHtml(student.SpeaksOtherLanguage) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Home Language</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.HomeLanguage) ? "empty" : "")}"">{EscapeHtml(student.HomeLanguage) ?? "-"}</div>
            </div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Indigenous Status</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.IndigenousStatus) ? "empty" : "")}"">{EscapeHtml(student.IndigenousStatus) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Has Disability</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.HasDisability) ? "empty" : "")}"">{EscapeHtml(student.HasDisability) ?? "-"}</div>
            </div>
        </div>

        {(!string.IsNullOrEmpty(student.DisabilityTypes) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Disability Types</span>
            <div class=""form-value"">{EscapeHtml(FormatList(student.DisabilityTypes))}</div>
        </div>
        " : "")}

        {(!string.IsNullOrEmpty(student.DisabilityNotes) ? $@"
        <div class=""form-group"">
            <span class=""form-label"">Disability Notes</span>
            <div class=""form-value"">{EscapeHtml(student.DisabilityNotes)}</div>
        </div>
        " : "")}
    </div>

    <!-- Section 5: Declaration -->
    <div class=""section"">
        <div class=""section-title"">Section 5: Privacy Notice and Declaration</div>
        
        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Accepted Privacy Notice</span>
                <div class=""form-value"">{(student.AcceptedPrivacyNotice ? "Yes" : "No")}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Accepted Terms & Conditions</span>
                <div class=""form-value"">{(student.AcceptedTermsAndConditions ? "Yes" : "No")}</div>
            </div>
        </div>

        <div class=""two-col"">
            <div class=""form-group"">
                <span class=""form-label"">Declaration Name</span>
                <div class=""form-value {(string.IsNullOrEmpty(student.DeclarationName) ? "empty" : "")}"">{EscapeHtml(student.DeclarationName) ?? "-"}</div>
            </div>
            <div class=""form-group"">
                <span class=""form-label"">Declaration Date</span>
                <div class=""form-value"">{student.DeclarationDate?.ToString("dd/MM/yyyy") ?? "-"}</div>
            </div>
        </div>

        <div class=""form-group"">
            <span class=""form-label"">Signature</span>
            <div class=""signature-box"">
                {(string.IsNullOrEmpty(student.SignatureData) ? "<span style='color: #999;'>No signature provided</span>" : $"<img src='{student.SignatureData}' alt='Signature' />")}
            </div>
        </div>
    </div>

    <div class=""footer"">
        <p><strong>Form Submitted:</strong> {student.EnrollmentFormSubmittedAt?.ToString("dd/MM/yyyy HH:mm") ?? "Not submitted"}</p>
        {(student.EnrollmentFormReviewedAt.HasValue ? $"<p><strong>Reviewed:</strong> {student.EnrollmentFormReviewedAt?.ToString("dd/MM/yyyy HH:mm")}</p>" : "")}
        <p style=""margin-top: 10px;"">Generated on {DateTime.Now:dd/MM/yyyy HH:mm} | AIET College Enrollment System</p>
    </div>
</body>
</html>";

            return html;
        }

        private string EscapeHtml(string? text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;
            return System.Net.WebUtility.HtmlEncode(text);
        }

        private string GetDocumentUrl(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return "#";
            return _fileStorageService.GetFileUrl(relativePath);
        }

        private static string FormatList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return string.Empty;
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(json);
                return list != null ? string.Join(", ", list) : json;
            }
            catch
            {
                return json;
            }
        }
    }
}
