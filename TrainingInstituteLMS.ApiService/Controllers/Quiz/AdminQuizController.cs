using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Quiz
{
    [ApiController]
    [Route("api/admin/quiz")]
    public class AdminQuizController : ControllerBase
    {
        private readonly IAdminQuizService _adminQuizService;

        public AdminQuizController(IAdminQuizService adminQuizService)
        {
            _adminQuizService = adminQuizService;
        }

        /// <summary>
        /// Get all quiz results with filtering and pagination
        /// </summary>
        [HttpGet("results")]
        public async Task<IActionResult> GetAllQuizResults(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] bool? isPassed = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var results = await _adminQuizService.GetAllQuizResultsAsync(
                search, status, isPassed, fromDate, toDate, pageNumber, pageSize);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Quiz results retrieved successfully",
                Data = results
            });
        }

        /// <summary>
        /// Get a specific quiz result by ID
        /// </summary>
        [HttpGet("results/{quizAttemptId}")]
        public async Task<IActionResult> GetQuizResultById(Guid quizAttemptId)
        {
            var result = await _adminQuizService.GetQuizResultByIdAsync(quizAttemptId);

            if (result == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Quiz result not found",
                    Data = null
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Quiz result retrieved successfully",
                Data = result
            });
        }

        /// <summary>
        /// Get quiz statistics
        /// </summary>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetQuizStatistics()
        {
            var statistics = await _adminQuizService.GetQuizStatisticsAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Statistics retrieved successfully",
                Data = statistics
            });
        }

        /// <summary>
        /// Create admin bypass for a failed student
        /// </summary>
        [HttpPost("bypass")]
        public async Task<IActionResult> CreateAdminBypass(
            [FromBody] CreateAdminBypassRequestDto request,
            [FromHeader(Name = "X-Admin-UserId")] Guid adminUserId)
        {
            if (adminUserId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Admin user ID is required",
                    Data = null
                });
            }

            var result = await _adminQuizService.CreateAdminBypassAsync(request, adminUserId);

            if (result == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to approve student. This student may already be approved, or the quiz attempt was not found.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Student has been approved to enroll in courses",
                Data = result
            });
        }

        /// <summary>
        /// Reject a student's quiz attempt
        /// </summary>
        [HttpPost("reject")]
        public async Task<IActionResult> RejectStudent(
            [FromBody] RejectStudentRequestDto request,
            [FromHeader(Name = "X-Admin-UserId")] Guid adminUserId)
        {
            if (adminUserId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Admin user ID is required",
                    Data = null
                });
            }

            var result = await _adminQuizService.RejectStudentAsync(request, adminUserId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to reject student. Quiz attempt not found.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Student has been rejected",
                Data = null
            });
        }

        /// <summary>
        /// Revoke an admin bypass
        /// </summary>
        [HttpDelete("bypass/{bypassId}")]
        public async Task<IActionResult> RevokeAdminBypass(
            Guid bypassId,
            [FromHeader(Name = "X-Admin-UserId")] Guid adminUserId)
        {
            if (adminUserId == Guid.Empty)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Admin user ID is required",
                    Data = null
                });
            }

            var result = await _adminQuizService.RevokeAdminBypassAsync(bypassId, adminUserId);

            if (!result)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Bypass not found",
                    Data = null
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Bypass has been revoked",
                Data = null
            });
        }

        /// <summary>
        /// Get all admin bypasses
        /// </summary>
        [HttpGet("bypasses")]
        public async Task<IActionResult> GetAllAdminBypasses()
        {
            var bypasses = await _adminQuizService.GetAllAdminBypassesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Admin bypasses retrieved successfully",
                Data = bypasses
            });
        }

        /// <summary>
        /// Get admin bypass by student ID
        /// </summary>
        [HttpGet("bypass/student/{studentId}")]
        public async Task<IActionResult> GetAdminBypassByStudentId(Guid studentId)
        {
            var bypass = await _adminQuizService.GetAdminBypassByStudentIdAsync(studentId);

            if (bypass == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No active bypass found for this student",
                    Data = null
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Bypass retrieved successfully",
                Data = bypass
            });
        }
    }
}
