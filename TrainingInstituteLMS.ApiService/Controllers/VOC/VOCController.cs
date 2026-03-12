using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Requests.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Responses.VOC;

namespace TrainingInstituteLMS.ApiService.Controllers.VOC
{
    [ApiController]
    [Route("api/[controller]")]
    public class VOCController : ControllerBase
    {
        private readonly IVOCService _vocService;
        private readonly ILogger<VOCController> _logger;

        public VOCController(IVOCService vocService, ILogger<VOCController> logger)
        {
            _vocService = vocService;
            _logger = logger;
        }

        [HttpPost("submit")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitVOC([FromBody] VOCSubmissionRequestDto request)
        {
            try
            {
                var result = await _vocService.SubmitVOCAsync(request);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SubmitVOC");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("admin/list")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetAllSubmissions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchQuery = null, [FromQuery] string? status = null)
        {
            try
            {
                var result = await _vocService.GetAllVOCSubmissionsAsync(pageNumber, pageSize, searchQuery, status);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllSubmissions");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("admin/{id}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetSubmissionById(Guid id)
        {
            try
            {
                var result = await _vocService.GetVOCSubmissionByIdAsync(id);
                if (result == null) return NotFound(new { success = false, message = "Submission not found" });
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSubmissionById");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPatch("admin/{id}/status")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] VOCStatusUpdateRequestDto request)
        {
            try
            {
                var result = await _vocService.UpdateVOCStatusAsync(id, request.Status);
                if (result == null) return NotFound(new { success = false, message = "Submission not found" });
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateStatus");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpDelete("admin/{id}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> DeleteSubmission(Guid id)
        {
            try
            {
                var result = await _vocService.DeleteVOCSubmissionAsync(id);
                if (!result) return NotFound(new { success = false, message = "Submission not found" });
                return Ok(new { success = true, message = "Submission deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteSubmission");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("admin/stats")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var result = await _vocService.GetVOCStatsAsync();
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetStats");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpPost("send-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> SendOTP([FromBody] SendOTPRequest request)
        {
            try
            {
                var (success, error) = await _vocService.SendVOCEmailOTPAsync(request.Email);
                if (success)
                    return Ok(new { success = true });
                return StatusCode(500, new { success = false, message = error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendOTP");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOTP([FromBody] VerifyOTPRequest request)
        {
            try
            {
                var result = await _vocService.VerifyVOCEmailOTPAsync(request.Email, request.OTP);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in VerifyOTP");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }

    public class SendOTPRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyOTPRequest
    {
        public string Email { get; set; } = string.Empty;
        public string OTP { get; set; } = string.Empty;
    }
}
