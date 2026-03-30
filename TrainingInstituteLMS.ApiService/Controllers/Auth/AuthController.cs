using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
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

        /// <summary>
        /// Issues the auth cookie on the API host so cross-origin requests with credentials (e.g. multipart bank transfer) are authenticated.
        /// </summary>
        private async Task SignInAuthCookieAsync(AuthResponseDto user)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.FullName),
                new(ClaimTypes.Role, user.UserType),
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
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
                var result = await _authService.LoginAsync(request);

                if (result.Failure == LoginFailureKind.EmailNotFound)
                {
                    _logger.LogWarning("Login failed — unknown or inactive email: {Email}", request.Email);
                    return Unauthorized(ApiResponse<AuthResponseDto>.FailureResponse("Email is incorrect."));
                }

                if (result.Failure == LoginFailureKind.WrongPassword)
                {
                    _logger.LogWarning("Login failed — wrong password for email: {Email}", request.Email);
                    return Unauthorized(ApiResponse<AuthResponseDto>.FailureResponse("Password is incorrect."));
                }

                var response = result.User!;
                await SignInAuthCookieAsync(response);
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

                await SignInAuthCookieAsync(response);
                _logger.LogInformation("User registered successfully: {Email}", request.Email);
                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(response, "Registration successful"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
                return StatusCode(500, ApiResponse<AuthResponseDto>.FailureResponse("An error occurred during registration"));
            }
        }

        /// <summary>Returns the signed-in user from the auth cookie so the SPA can sync with server session (localStorage alone is not enough for multipart/card calls).</summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> GetCurrentUser()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse<AuthResponseDto>.FailureResponse("Authentication required."));

            try
            {
                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                    return Unauthorized(ApiResponse<AuthResponseDto>.FailureResponse("Authentication required."));

                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(user, "OK"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving current user");
                return StatusCode(500, ApiResponse<AuthResponseDto>.FailureResponse("An error occurred."));
            }
        }

        /// <summary>Clears the API auth cookie (call from SPA on logout when using credentials).</summary>
        [HttpPost("logout")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<object?>>> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(ApiResponse<object?>.SuccessResponse(null, "Logged out"));
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
