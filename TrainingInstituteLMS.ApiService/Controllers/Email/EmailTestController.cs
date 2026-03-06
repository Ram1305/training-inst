using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Email;

namespace TrainingInstituteLMS.ApiService.Controllers.Email
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class EmailTestController : ControllerBase
    {
        private readonly IEmailTestService _emailTestService;
        private readonly ILogger<EmailTestController> _logger;

        public EmailTestController(
            IEmailTestService emailTestService,
            ILogger<EmailTestController> logger)
        {
            _emailTestService = emailTestService;
            _logger = logger;
        }

        /// <summary>
        /// Tests SMTP connection and authentication with Gmail
        /// </summary>
        [HttpGet("test-connection")]
        public async Task<IActionResult> TestConnection()
        {
            _logger.LogInformation("Email connection test initiated by user");
            var result = await _emailTestService.TestSmtpConnectionAsync();
            
            if (result.Success)
                return Ok(result);
            
            return StatusCode(StatusCodes.Status503ServiceUnavailable, result);
        }

        /// <summary>
        /// Sends a test email to verify the email service is working
        /// </summary>
        [HttpPost("send-test")]
        public async Task<IActionResult> SendTestEmail([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email address is required" });

            _logger.LogInformation("Sending test email to {Email}", email);
            var result = await _emailTestService.TestSendTestEmailAsync(email);

            if (result.Success)
                return Ok(result);

            return StatusCode(StatusCodes.Status503ServiceUnavailable, result);
        }
    }
}
