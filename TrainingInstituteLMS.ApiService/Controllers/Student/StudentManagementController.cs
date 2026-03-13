using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.StudentManagement;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Student;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Student;

namespace TrainingInstituteLMS.ApiService.Controllers.Student
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentManagementController : ControllerBase
    {
        private readonly IStudentManagementService _studentManagementService;
        private readonly ILogger<StudentManagementController> _logger;

        public StudentManagementController(
            IStudentManagementService studentManagementService,
            ILogger<StudentManagementController> logger)
        {
            _studentManagementService = studentManagementService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<StudentListResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<StudentListResponseDto>>> GetAllStudents([FromQuery] StudentFilterRequestDto filter)
        {
            try
            {
                var result = await _studentManagementService.GetAllStudentsAsync(filter);
                return Ok(ApiResponse<StudentListResponseDto>.SuccessResponse(result, "Students retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving students");
                return StatusCode(500, ApiResponse<StudentListResponseDto>.FailureResponse("An error occurred while retrieving students"));
            }
        }

        [HttpGet("{studentId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<StudentResponseDto>>> GetStudentById(Guid studentId)
        {
            try
            {
                var student = await _studentManagementService.GetStudentByIdAsync(studentId);

                if (student == null)
                {
                    return NotFound(ApiResponse<StudentResponseDto>.FailureResponse("Student not found"));
                }

                return Ok(ApiResponse<StudentResponseDto>.SuccessResponse(student, "Student retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student: {StudentId}", studentId);
                return StatusCode(500, ApiResponse<StudentResponseDto>.FailureResponse("An error occurred while retrieving student"));
            }
        }

        [HttpGet("user/{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<StudentResponseDto>>> GetStudentByUserId(Guid userId)
        {
            try
            {
                var student = await _studentManagementService.GetStudentByUserIdAsync(userId);

                if (student == null)
                {
                    return NotFound(ApiResponse<StudentResponseDto>.FailureResponse("Student not found"));
                }

                return Ok(ApiResponse<StudentResponseDto>.SuccessResponse(student, "Student retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student by user ID: {UserId}", userId);
                return StatusCode(500, ApiResponse<StudentResponseDto>.FailureResponse("An error occurred while retrieving student"));
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<StudentResponseDto>>> CreateStudent([FromBody] CreateStudentRequestDto request)
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
                var result = await _studentManagementService.CreateStudentAsync(request, null);

                if (result == null)
                {
                    return BadRequest(ApiResponse<StudentResponseDto>.FailureResponse("Email already exists"));
                }

                return Ok(ApiResponse<StudentResponseDto>.SuccessResponse(result, "Student created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating student");
                return StatusCode(500, ApiResponse<StudentResponseDto>.FailureResponse("An error occurred while creating student"));
            }
        }

        [HttpPut("{studentId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<StudentResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<StudentResponseDto>>> UpdateStudent(
            Guid studentId,
            [FromBody] UpdateStudentRequestDto request)
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
                var result = await _studentManagementService.UpdateStudentAsync(studentId, request);

                if (result == null)
                {
                    return NotFound(ApiResponse<StudentResponseDto>.FailureResponse("Student not found or email already exists"));
                }

                return Ok(ApiResponse<StudentResponseDto>.SuccessResponse(result, "Student updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating student: {StudentId}", studentId);
                return StatusCode(500, ApiResponse<StudentResponseDto>.FailureResponse("An error occurred while updating student"));
            }
        }

        [HttpDelete("{studentId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteStudent(Guid studentId)
        {
            try
            {
                var result = await _studentManagementService.DeleteStudentAsync(studentId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Student not found"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Student deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting student: {StudentId}", studentId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while deleting student"));
            }
        }

        [HttpPatch("{studentId:guid}/toggle-status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleStudentStatus(Guid studentId)
        {
            try
            {
                var result = await _studentManagementService.ToggleStudentStatusAsync(studentId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Student not found"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Student status toggled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling student status: {StudentId}", studentId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while toggling student status"));
            }
        }

        [HttpGet("stats")]
        [ProducesResponseType(typeof(ApiResponse<StudentStatsResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<StudentStatsResponseDto>>> GetStudentStats()
        {
            try
            {
                var stats = await _studentManagementService.GetStudentStatsAsync();
                return Ok(ApiResponse<StudentStatsResponseDto>.SuccessResponse(stats, "Stats retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student stats");
                return StatusCode(500, ApiResponse<StudentStatsResponseDto>.FailureResponse("An error occurred while retrieving stats"));
            }
        }
    }
}
