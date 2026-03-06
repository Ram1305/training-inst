using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.SuperAdmin;
using TrainingInstituteLMS.DTOs.DTOs.Requests.SuperAdmin;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.SuperAdmin;

namespace TrainingInstituteLMS.ApiService.Controllers.SuperAdmin
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminManagementController : ControllerBase
    {
        private readonly IAdminManagementService _adminManagementService;
        private readonly ILogger<AdminManagementController> _logger;

        public AdminManagementController(
            IAdminManagementService adminManagementService,
            ILogger<AdminManagementController> logger)
        {
            _adminManagementService = adminManagementService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<AdminListResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<AdminListResponseDto>>> GetAllAdmins([FromQuery] AdminFilterRequestDto filter)
        {
            try
            {
                var result = await _adminManagementService.GetAllAdminsAsync(filter);
                return Ok(ApiResponse<AdminListResponseDto>.SuccessResponse(result, "Admins retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admins");
                return StatusCode(500, ApiResponse<AdminListResponseDto>.FailureResponse("An error occurred while retrieving admins"));
            }
        }

        [HttpGet("{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<AdminResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AdminResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AdminResponseDto>>> GetAdminById(Guid userId)
        {
            try
            {
                var admin = await _adminManagementService.GetAdminByIdAsync(userId);

                if (admin == null)
                {
                    return NotFound(ApiResponse<AdminResponseDto>.FailureResponse("Admin not found"));
                }

                return Ok(ApiResponse<AdminResponseDto>.SuccessResponse(admin, "Admin retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin: {UserId}", userId);
                return StatusCode(500, ApiResponse<AdminResponseDto>.FailureResponse("An error occurred while retrieving admin"));
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<AdminResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<AdminResponseDto>>> CreateAdmin([FromBody] CreateAdminRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ErrorResponse
                {
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            try
            {
                // ✅ Service will auto-find SuperAdmin, so just pass null
                var result = await _adminManagementService.CreateAdminAsync(request, null);

                if (result == null)
                {
                    return BadRequest(ApiResponse<AdminResponseDto>.FailureResponse("Email already exists"));
                }

                return Ok(ApiResponse<AdminResponseDto>.SuccessResponse(result, "Admin created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin");
                return StatusCode(500, ApiResponse<AdminResponseDto>.FailureResponse("An error occurred while creating admin"));
            }
        }

        [HttpPut("{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<AdminResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<AdminResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AdminResponseDto>>> UpdateAdmin(
            Guid userId,
            [FromBody] UpdateAdminRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ErrorResponse
                {
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            try
            {
                var result = await _adminManagementService.UpdateAdminAsync(userId, request);

                if (result == null)
                {
                    return NotFound(ApiResponse<AdminResponseDto>.FailureResponse("Admin not found or email already exists"));
                }

                return Ok(ApiResponse<AdminResponseDto>.SuccessResponse(result, "Admin updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin: {UserId}", userId);
                return StatusCode(500, ApiResponse<AdminResponseDto>.FailureResponse("An error occurred while updating admin"));
            }
        }

        [HttpDelete("{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteAdmin(Guid userId)
        {
            try
            {
                var result = await _adminManagementService.DeleteAdminAsync(userId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Admin not found or cannot be deleted"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Admin deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting admin: {UserId}", userId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while deleting admin"));
            }
        }

        [HttpPatch("{userId:guid}/toggle-status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleAdminStatus(Guid userId)
        {
            try
            {
                var result = await _adminManagementService.ToggleAdminStatusAsync(userId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Admin not found or cannot be toggled"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Admin status toggled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling admin status: {UserId}", userId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while toggling admin status"));
            }
        }

        [HttpGet("stats")]
        [ProducesResponseType(typeof(ApiResponse<AdminStatsResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<AdminStatsResponseDto>>> GetAdminStats()
        {
            try
            {
                var stats = await _adminManagementService.GetAdminStatsAsync();
                return Ok(ApiResponse<AdminStatsResponseDto>.SuccessResponse(stats, "Stats retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin stats");
                return StatusCode(500, ApiResponse<AdminStatsResponseDto>.FailureResponse("An error occurred while retrieving stats"));
            }
        }
    }
}
