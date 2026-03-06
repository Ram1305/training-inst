using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.StudentEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Requests.StudentEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment;

namespace TrainingInstituteLMS.ApiService.Controllers.StudentEnrollment
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentEnrollmentFormController : ControllerBase
    {
        private readonly IStudentEnrollmentFormService _enrollmentFormService;
        private readonly IEnrollmentFormPdfService _pdfService;

        public StudentEnrollmentFormController(
            IStudentEnrollmentFormService enrollmentFormService,
            IEnrollmentFormPdfService pdfService)
        {
            _enrollmentFormService = enrollmentFormService;
            _pdfService = pdfService;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        private Guid? GetCurrentStudentId()
        {
            var studentIdClaim = User.FindFirst("StudentId")?.Value;
            return Guid.TryParse(studentIdClaim, out var studentId) ? studentId : null;
        }

        #region Public Endpoints

        /// <summary>
        /// Submit enrollment form as a public/guest user - creates account and submits form
        /// </summary>
        [HttpPost("public/submit")]
        public async Task<IActionResult> SubmitPublicEnrollmentForm([FromBody] SubmitPublicEnrollmentFormRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(ApiResponse<object>.FailureResponse("Password is required"));

            if (request.Password.Length < 6)
                return BadRequest(ApiResponse<object>.FailureResponse("Password must be at least 6 characters"));

            try
            {
                var result = await _enrollmentFormService.SubmitPublicEnrollmentFormAsync(request);
                return Ok(ApiResponse<PublicEnrollmentFormResponseDto>.SuccessResponse(result, "Account created and enrollment form submitted successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        #endregion

        #region Student Endpoints

        /// <summary>
        /// Get the current student's enrollment form
        /// </summary>
        [HttpGet("my-form")]
        public async Task<IActionResult> GetMyEnrollmentForm()
        {
            var studentId = GetCurrentStudentId();
            if (!studentId.HasValue)
            {
                // Return empty form data for unauthenticated users
                return Ok(ApiResponse<object>.SuccessResponse(null, "No enrollment form found"));
            }

            try
            {
                var form = await _enrollmentFormService.GetEnrollmentFormAsync(studentId.Value);
                return Ok(ApiResponse<object>.SuccessResponse(form));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get enrollment form by student ID
        /// </summary>
        [HttpGet("student/{studentId}")]
        public async Task<IActionResult> GetEnrollmentFormByStudentId(Guid studentId)
        {
            try
            {
                var form = await _enrollmentFormService.GetEnrollmentFormAsync(studentId);
                if (form == null)
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment form not found"));

                return Ok(ApiResponse<object>.SuccessResponse(form));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Submit the enrollment form for a student
        /// </summary>
        [HttpPost("submit/{studentId}")]
        public async Task<IActionResult> SubmitEnrollmentFormForStudent(Guid studentId, [FromBody] SubmitEnrollmentFormRequestDto request)
        {
            try
            {
                var result = await _enrollmentFormService.SubmitEnrollmentFormAsync(studentId, request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment form submitted successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Submit the enrollment form for the current student
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitEnrollmentForm([FromBody] SubmitEnrollmentFormRequestDto request)
        {
            var studentId = GetCurrentStudentId();
            if (!studentId.HasValue)
                return BadRequest(ApiResponse<object>.FailureResponse("Student ID not found. Please use /submit/{studentId} endpoint."));

            try
            {
                var result = await _enrollmentFormService.SubmitEnrollmentFormAsync(studentId.Value, request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment form submitted successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update the enrollment form for a student
        /// </summary>
        [HttpPut("update/{studentId}")]
        public async Task<IActionResult> UpdateEnrollmentFormForStudent(Guid studentId, [FromBody] SubmitEnrollmentFormRequestDto request)
        {
            try
            {
                var result = await _enrollmentFormService.UpdateEnrollmentFormAsync(studentId, request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment form updated successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update the enrollment form for the current student
        /// </summary>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateEnrollmentForm([FromBody] SubmitEnrollmentFormRequestDto request)
        {
            var studentId = GetCurrentStudentId();
            if (!studentId.HasValue)
                return BadRequest(ApiResponse<object>.FailureResponse("Student ID not found. Please use /update/{studentId} endpoint."));

            try
            {
                var result = await _enrollmentFormService.UpdateEnrollmentFormAsync(studentId.Value, request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment form updated successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Upload a document for a student's enrollment form
        /// </summary>
        [HttpPost("upload-document/{studentId}")]
        public async Task<IActionResult> UploadDocumentForStudent(Guid studentId, IFormFile file, [FromQuery] string documentType)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.FailureResponse("No file provided"));

            var validTypes = new[] { "primaryId", "secondaryId", "usiId", "qualification" };
            if (!validTypes.Contains(documentType))
                return BadRequest(ApiResponse<object>.FailureResponse("Invalid document type"));

            try
            {
                var url = await _enrollmentFormService.UploadDocumentAsync(studentId, file, documentType);
                return Ok(ApiResponse<object>.SuccessResponse(new { documentUrl = url }, "Document uploaded successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Upload a document for the enrollment form
        /// </summary>
        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromQuery] string documentType)
        {
            var studentId = GetCurrentStudentId();
            if (!studentId.HasValue)
                return BadRequest(ApiResponse<object>.FailureResponse("Student ID not found. Please use /upload-document/{studentId} endpoint."));

            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.FailureResponse("No file provided"));

            var validTypes = new[] { "primaryId", "secondaryId", "usiId", "qualification" };
            if (!validTypes.Contains(documentType))
                return BadRequest(ApiResponse<object>.FailureResponse("Invalid document type"));

            try
            {
                var url = await _enrollmentFormService.UploadDocumentAsync(studentId.Value, file, documentType);
                return Ok(ApiResponse<object>.SuccessResponse(new { documentUrl = url }, "Document uploaded successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        #endregion

        #region Admin Endpoints

        /// <summary>
        /// Get all enrollment forms for admin review
        /// </summary>
        [HttpGet("admin/list")]
        public async Task<IActionResult> GetEnrollmentFormsForAdmin([FromQuery] EnrollmentFormFilterRequestDto filter)
        {
            try
            {
                var result = await _enrollmentFormService.GetEnrollmentFormsForAdminAsync(filter);
                return Ok(ApiResponse<object>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get a specific student's enrollment form for admin review
        /// </summary>
        [HttpGet("admin/{studentId}")]
        public async Task<IActionResult> GetEnrollmentFormByIdForAdmin(Guid studentId)
        {
            try
            {
                var form = await _enrollmentFormService.GetEnrollmentFormByIdForAdminAsync(studentId);
                if (form == null)
                    return NotFound(ApiResponse<object>.FailureResponse("Student or enrollment form not found"));

                return Ok(ApiResponse<object>.SuccessResponse(form));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Approve or reject a student's enrollment form
        /// </summary>
        [HttpPost("admin/{studentId}/review")]
        public async Task<IActionResult> ReviewEnrollmentForm(Guid studentId, [FromBody] ReviewEnrollmentFormRequestDto request, [FromQuery] Guid? reviewerId = null)
        {
            var userId = reviewerId ?? GetCurrentUserId() ?? Guid.Empty;

            try
            {
                var success = await _enrollmentFormService.ReviewEnrollmentFormAsync(studentId, request, userId);
                if (!success)
                    return NotFound(ApiResponse<object>.FailureResponse("Student not found"));

                var message = request.Approve 
                    ? "Enrollment form approved successfully" 
                    : "Enrollment form rejected";
                return Ok(ApiResponse<object>.SuccessResponse(null, message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update a student's enrollment form as admin
        /// </summary>
        [HttpPut("admin/{studentId}")]
        public async Task<IActionResult> UpdateEnrollmentFormByAdmin(Guid studentId, [FromBody] SubmitEnrollmentFormRequestDto request, [FromQuery] Guid? updatedBy = null)
        {
            var userId = updatedBy ?? GetCurrentUserId() ?? Guid.Empty;

            try
            {
                var result = await _enrollmentFormService.UpdateEnrollmentFormByAdminAsync(studentId, request, userId);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment form updated successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get enrollment form statistics for admin dashboard
        /// </summary>
        [HttpGet("admin/stats")]
        public async Task<IActionResult> GetEnrollmentFormStats()
        {
            try
            {
                var stats = await _enrollmentFormService.GetEnrollmentFormStatsAsync();
                return Ok(ApiResponse<object>.SuccessResponse(stats));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Upload a document for a student as admin
        /// </summary>
        [HttpPost("admin/{studentId}/upload-document")]
        public async Task<IActionResult> AdminUploadDocumentForStudent(Guid studentId, IFormFile file, [FromQuery] string documentType)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<object>.FailureResponse("No file provided"));

            var validTypes = new[] { "primaryId", "secondaryId", "usiId", "qualification" };
            if (!validTypes.Contains(documentType))
                return BadRequest(ApiResponse<object>.FailureResponse("Invalid document type"));

            try
            {
                var url = await _enrollmentFormService.UploadDocumentAsync(studentId, file, documentType);
                return Ok(ApiResponse<object>.SuccessResponse(new { documentUrl = url }, "Document uploaded successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get enrollment form as HTML (for PDF generation client-side)
        /// </summary>
        [HttpGet("admin/{studentId}/pdf/html")]
        public async Task<IActionResult> GetEnrollmentFormHtml(Guid studentId)
        {
            try
            {
                var html = await _pdfService.GenerateEnrollmentFormHtmlAsync(studentId);
                return Content(html, "text/html");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Download enrollment form as PDF
        /// </summary>
        [HttpGet("admin/{studentId}/pdf/download")]
        public async Task<IActionResult> DownloadEnrollmentFormPdf(Guid studentId)
        {
            try
            {
                var html = await _pdfService.GenerateEnrollmentFormHtmlAsync(studentId);
                var bytes = System.Text.Encoding.UTF8.GetBytes(html);
                
                // Return as HTML file that can be printed to PDF
                return File(bytes, "text/html", $"enrollment-form-{studentId}.html");
            }
            catch (ArgumentException ex)
            {
                return NotFound(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse($"An error occurred: {ex.Message}"));
            }
        }

        #endregion
    }
}
