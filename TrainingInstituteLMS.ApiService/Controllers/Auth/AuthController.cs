using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
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
                var response = await _authService.LoginAsync(request);

                if (response == null)
                {
                    _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
                    return Unauthorized(ApiResponse<AuthResponseDto>.FailureResponse("Invalid email or password"));
                }

                _logger.LogInformation("User logged in successfully: {Email}", request.Email);
                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(response, "Login successful"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
                return StatusCode(500, ApiResponse<AuthResponseDto>.FailureResponse("An error occurred during login"));
            }
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto request)
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
                var response = await _authService.RegisterAsync(request);

                if (response == null)
                {
                    _logger.LogWarning("Registration failed - email already exists: {Email}", request.Email);
                    return BadRequest(ApiResponse<AuthResponseDto>.FailureResponse("Email already exists"));
                }

                _logger.LogInformation("User registered successfully: {Email}", request.Email);
                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(response, "Registration successful"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
                return StatusCode(500, ApiResponse<AuthResponseDto>.FailureResponse("An error occurred during registration"));
            }
        }

        [HttpGet("check-email/{email}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<bool>>> CheckEmail(string email)
        {
            try
            {
                var exists = await _authService.EmailExistsAsync(email);
                return Ok(ApiResponse<bool>.SuccessResponse(exists, "Email check completed"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking email: {Email}", email);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while checking email"));
            }
        }

        [HttpGet("user/{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> GetUser(Guid userId)
        {
            try
            {
                var user = await _authService.GetUserByIdAsync(userId);

                if (user == null)
                {
                    return NotFound(ApiResponse<AuthResponseDto>.FailureResponse("User not found"));
                }

                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(user, "User retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user: {UserId}", userId);
                return StatusCode(500, ApiResponse<AuthResponseDto>.FailureResponse("An error occurred while retrieving user"));
            }
        }
    }
}
