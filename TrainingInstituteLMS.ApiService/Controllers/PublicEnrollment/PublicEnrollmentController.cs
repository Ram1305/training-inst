using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.PublicEnrollment;
using TrainingInstituteLMS.ApiService.Services.SiteSettings;
using TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment;

namespace TrainingInstituteLMS.ApiService.Controllers.PublicEnrollment
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicEnrollmentController : ControllerBase
    {
        private readonly IPublicEnrollmentService _publicEnrollmentService;
        private readonly ISiteSettingsService _siteSettingsService;
        private readonly ILogger<PublicEnrollmentController> _logger;

        public PublicEnrollmentController(IPublicEnrollmentService publicEnrollmentService, ISiteSettingsService siteSettingsService, ILogger<PublicEnrollmentController> logger)
        {
            _publicEnrollmentService = publicEnrollmentService;
            _siteSettingsService = siteSettingsService;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        #region Public Endpoints

        /// <summary>
        /// Get all active courses for dropdown
        /// </summary>
        [HttpGet("courses")]
        public async Task<IActionResult> GetCoursesForDropdown()
        {
            try
            {
                var courses = await _publicEnrollmentService.GetCoursesForDropdownAsync();
                return Ok(ApiResponse<object>.SuccessResponse(courses));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get available dates for a specific course
        /// </summary>
        [HttpGet("courses/{courseId}/dates")]
        public async Task<IActionResult> GetCourseDates(Guid courseId)
        {
            try
            {
                var dates = await _publicEnrollmentService.GetCourseDatesAsync(courseId);
                return Ok(ApiResponse<object>.SuccessResponse(dates));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Register a new user (creates User + Student)
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] PublicRegistrationRequestDto request)
        {
            try
            {
                var result = await _publicEnrollmentService.RegisterUserAsync(request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Registration successful"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Enroll in a course with selected date
        /// </summary>
        [HttpPost("enroll")]
        public async Task<IActionResult> EnrollInCourse([FromBody] PublicCourseEnrollmentRequestDto request)
        {
            try
            {
                var result = await _publicEnrollmentService.EnrollInCourseAsync(request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment successful"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get the canonical enrollment base URL (from SiteSettings collection). Used by the frontend so enrollment link is consistent everywhere.
        /// </summary>
        [HttpGet("site-url")]
        public async Task<IActionResult> GetEnrollmentBaseUrl()
        {
            try
            {
                var url = await _siteSettingsService.GetEnrollmentBaseUrlAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new EnrollmentBaseUrlResponseDto { EnrollmentBaseUrl = url }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting enrollment base URL");
                return StatusCode(500, ApiResponse<object>.FailureResponse("Failed to get site URL"));
            }
        }

        /// <summary>
        /// Get enrollment link data by unique code
        /// </summary>
        [HttpGet("link/{code}")]
        public async Task<IActionResult> GetLinkByCode(string code)
        {
            try
            {
                var linkData = await _publicEnrollmentService.GetEnrollmentLinkByCodeAsync(code);
                if (linkData == null)
                {
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment link not found or expired"));
                }
                return Ok(ApiResponse<object>.SuccessResponse(linkData));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Process company order card payment. Returns transaction ID to use when creating the company order.
        /// </summary>
        [HttpPost("company/process-card")]
        public async Task<IActionResult> ProcessCompanyCardPayment([FromBody] CompanyCardPaymentRequestDto request)
        {
            try
            {
                var result = await _publicEnrollmentService.ProcessCompanyCardPaymentAsync(request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Payment processed"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Create a company order: multiple courses, one-time links returned (and optionally sent by email).
        /// </summary>
        [HttpPost("company/order")]
        public async Task<IActionResult> CreateCompanyOrder([FromBody] CompanyOrderRequestDto? request)
        {
            if (request == null)
            {
                _logger.LogWarning("Company order request body was null or invalid JSON.");
                return BadRequest(ApiResponse<object>.FailureResponse("Request body is required. Send JSON with companyName, companyEmail, items (array of { courseId, price }), and paymentMethod."));
            }
            try
            {
                var result = await _publicEnrollmentService.CreateCompanyOrderAsync(request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Company order created. One-time links are ready."));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Company order rejected: {Message}", ex.Message);
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Complete enrollment via a one-time link (name, email, phone, password only; no payment, no LLN).
        /// </summary>
        [HttpPost("link/{code}/complete")]
        public async Task<IActionResult> CompleteEnrollmentViaLink(string code, [FromBody] OneTimeLinkCompleteRequestDto request)
        {
            if (request == null)
                return BadRequest(ApiResponse<object>.FailureResponse("Request body is required. Send JSON with fullName, email, phone, and password."));
            try
            {
                var result = await _publicEnrollmentService.CompleteEnrollmentViaLinkAsync(code, request);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Registration complete. Please log in to continue."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        #endregion

        #region Admin Endpoints

        /// <summary>
        /// Create a new enrollment link
        /// </summary>
        [HttpPost("admin/links")]
        public async Task<IActionResult> CreateEnrollmentLink([FromBody] CreateEnrollmentLinkRequestDto? request)
        {
            if (request == null)
            {
                _logger.LogWarning("CreateEnrollmentLink received null request body");
                return BadRequest(ApiResponse<object>.FailureResponse("Request body is required. Send JSON with name (required), description (optional), courseId (optional), maxUses (optional), expiresAt (optional), and allowPayLater (optional)."));
            }
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(ApiResponse<object>.FailureResponse("Name is required"));
            }
            try
            {
                var createdBy = GetCurrentUserId() ?? Guid.Empty;
                var result = await _publicEnrollmentService.CreateEnrollmentLinkAsync(request, createdBy);
                return Ok(ApiResponse<object>.SuccessResponse(result, "Enrollment link created successfully"));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "CreateEnrollmentLink validation failed");
                return BadRequest(ApiResponse<object>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateEnrollmentLink failed. Name: {Name}, CourseId: {CourseId}", request.Name, request.CourseId);
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get all enrollment links
        /// </summary>
        [HttpGet("admin/links")]
        public async Task<IActionResult> GetEnrollmentLinks([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _publicEnrollmentService.GetEnrollmentLinksAsync(page, pageSize);
                return Ok(ApiResponse<object>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get a specific enrollment link
        /// </summary>
        [HttpGet("admin/links/{linkId}")]
        public async Task<IActionResult> GetEnrollmentLink(Guid linkId)
        {
            try
            {
                var result = await _publicEnrollmentService.GetEnrollmentLinkAsync(linkId);
                if (result == null)
                {
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment link not found"));
                }
                return Ok(ApiResponse<object>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Toggle enrollment link status
        /// </summary>
        [HttpPatch("admin/links/{linkId}/toggle")]
        public async Task<IActionResult> ToggleLinkStatus(Guid linkId)
        {
            try
            {
                var success = await _publicEnrollmentService.ToggleLinkStatusAsync(linkId);
                if (!success)
                {
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment link not found"));
                }
                return Ok(ApiResponse<object>.SuccessResponse(null, "Link status updated"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Delete an enrollment link
        /// </summary>
        [HttpDelete("admin/links/{linkId}")]
        public async Task<IActionResult> DeleteEnrollmentLink(Guid linkId)
        {
            try
            {
                var success = await _publicEnrollmentService.DeleteEnrollmentLinkAsync(linkId);
                if (!success)
                {
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment link not found"));
                }
                return Ok(ApiResponse<object>.SuccessResponse(null, "Enrollment link deleted"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Regenerate QR code for an enrollment link
        /// </summary>
        [HttpPost("admin/links/{linkId}/regenerate-qr")]
        public async Task<IActionResult> RegenerateQRCode(Guid linkId)
        {
            try
            {
                var qrCodeData = await _publicEnrollmentService.RegenerateQRCodeAsync(linkId);
                if (qrCodeData == null)
                {
                    return NotFound(ApiResponse<object>.FailureResponse("Enrollment link not found"));
                }
                return Ok(ApiResponse<object>.SuccessResponse(new { qrCodeDataUrl = qrCodeData }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get company orders for admin (status, course count, etc.)
        /// </summary>
        [HttpGet("admin/company-orders")]
        public async Task<IActionResult> GetAdminCompanyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            try
            {
                var result = await _publicEnrollmentService.GetAdminCompanyOrdersAsync(page, pageSize, status, search);
                return Ok(ApiResponse<object>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get a single company order by id (with course/link details).
        /// </summary>
        [HttpGet("admin/company-orders/{orderId}")]
        public async Task<IActionResult> GetAdminCompanyOrderById(Guid orderId)
        {
            try
            {
                var result = await _publicEnrollmentService.GetAdminCompanyOrderByIdAsync(orderId);
                if (result == null)
                    return NotFound(ApiResponse<object>.FailureResponse("Company order not found"));
                return Ok(ApiResponse<object>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Update company order status (e.g. Pending, Completed, Cancelled).
        /// </summary>
        [HttpPatch("admin/company-orders/{orderId}/status")]
        public async Task<IActionResult> UpdateCompanyOrderStatus(Guid orderId, [FromBody] UpdateCompanyOrderStatusRequestDto? request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Status))
                    return BadRequest(ApiResponse<object>.FailureResponse("Status is required"));
                var success = await _publicEnrollmentService.UpdateCompanyOrderStatusAsync(orderId, request.Status.Trim());
                if (!success)
                    return NotFound(ApiResponse<object>.FailureResponse("Company order not found"));
                return Ok(ApiResponse<object>.SuccessResponse(null, "Status updated"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// Get total company order count (for admin nav/badge).
        /// </summary>
        [HttpGet("admin/company-orders/count")]
        public async Task<IActionResult> GetCompanyOrderCount()
        {
            try
            {
                var count = await _publicEnrollmentService.GetCompanyOrderCountAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { companyOrderCount = count }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.FailureResponse(ex.Message));
            }
        }

        #endregion
    }
}
