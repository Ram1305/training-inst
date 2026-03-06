using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using TrainingInstituteLMS.ApiService.Configuration;

namespace TrainingInstituteLMS.ApiService.Services.Email
{
    public interface IEmailTestService
    {
        Task<EmailTestResultDto> TestSmtpConnectionAsync();
        Task<EmailTestResultDto> TestSendTestEmailAsync(string testEmailAddress);
    }

    public class EmailTestService : IEmailTestService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailTestService> _logger;

        public EmailTestService(
            IOptions<EmailSettings> settings,
            ILogger<EmailTestService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<EmailTestResultDto> TestSmtpConnectionAsync()
        {
            var result = new EmailTestResultDto
            {
                TestName = "SMTP Connection Test",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                if (!_settings.IsConfigured)
                {
                    result.Success = false;
                    result.Message = "Email settings are not configured";
                    result.Details = "EmailSettings.IsConfigured returned false. Check your appsettings.json configuration.";
                    _logger.LogWarning("Email settings not configured");
                    return result;
                }

                var user = _settings.User?.Trim() ?? string.Empty;
                var password = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();

                if (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
                {
                    result.Success = false;
                    result.Message = "Email credentials are missing";
                    result.Details = "User or Password is empty in appsettings.json";
                    _logger.LogWarning("Email credentials missing");
                    return result;
                }

                using var client = new SmtpClient();
                
                // Connect to SMTP server
                _logger.LogInformation("Connecting to SMTP server: {Host}:{Port}", _settings.SmtpHost, _settings.SmtpPort);
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);
                result.Details = $"Successfully connected to {_settings.SmtpHost}:{_settings.SmtpPort}";

                // Authenticate
                _logger.LogInformation("Authenticating with user: {User}", user);
                await client.AuthenticateAsync(user, password);
                result.Details += $"\nSuccessfully authenticated as {user}";

                await client.DisconnectAsync(true);

                result.Success = true;
                result.Message = "SMTP connection and authentication successful!";
                _logger.LogInformation("SMTP connection test passed");
            }
            catch (MailKit.Security.AuthenticationException authEx)
            {
                result.Success = false;
                result.Message = "SMTP Authentication Failed";
                result.Details = $"Error: {authEx.Message}\n\n" +
                    "This typically means:\n" +
                    "1. The Gmail App Password is incorrect\n" +
                    "2. 2-Step Verification is not enabled on your Gmail account\n" +
                    "3. The Email User in appsettings.json is wrong\n\n" +
                    "Solution:\n" +
                    "- Go to https://myaccount.google.com/apppasswords\n" +
                    "- Select 'Mail' and 'Windows Computer'\n" +
                    "- Generate a new 16-character App Password\n" +
                    "- Update the 'Password' field in appsettings.json";
                _logger.LogError(authEx, "SMTP authentication failed for user: {User}", _settings.User);
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Message = "Connection Test Failed";
                result.Details = $"Error: {ex.Message}\n\nStack Trace: {ex.StackTrace}";
                _logger.LogError(ex, "SMTP connection test error");
            }

            return result;
        }

        public async Task<EmailTestResultDto> TestSendTestEmailAsync(string testEmailAddress)
        {
            var result = new EmailTestResultDto
            {
                TestName = "Send Test Email",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                // First test connection
                var connectionTest = await TestSmtpConnectionAsync();
                if (!connectionTest.Success)
                {
                    result.Success = false;
                    result.Message = "Cannot send test email - SMTP connection failed";
                    result.Details = connectionTest.Details;
                    return result;
                }

                if (string.IsNullOrWhiteSpace(testEmailAddress))
                {
                    result.Success = false;
                    result.Message = "Test email address is required";
                    return result;
                }

                var user = _settings.User?.Trim() ?? string.Empty;
                var password = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();

                using var client = new SmtpClient();
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(user, password);

                var message = new MimeKit.MimeMessage();
                message.From.Add(new MimeKit.MailboxAddress(_settings.FromName, user));
                message.To.Add(MimeKit.MailboxAddress.Parse(testEmailAddress));
                message.Subject = "Test Email - Training Institute LMS";
                message.Body = new MimeKit.TextPart("html")
                {
                    Text = @"<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<title>Test Email</title>
</head>
<body style='font-family:Arial,Helvetica,sans-serif;padding:20px;'>
<h2 style='color:#4f46e5;'>Test Email Successful!</h2>
<p>This is a test email from the Training Institute LMS.</p>
<p><strong>Configuration Status:</strong> ✓ Working</p>
<p>Your email service is properly configured and ready to send notifications.</p>
<hr/>
<p style='font-size:12px;color:#666;'>This is an automated test message. Please do not reply.</p>
</body>
</html>"
                };

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                result.Success = true;
                result.Message = "Test email sent successfully!";
                result.Details = $"Test email was sent to {testEmailAddress}\n\nCheck your inbox to confirm delivery.";
                _logger.LogInformation("Test email sent successfully to {Email}", testEmailAddress);
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Message = "Failed to send test email";
                result.Details = $"Error: {ex.Message}";
                _logger.LogError(ex, "Failed to send test email to {Email}", testEmailAddress);
            }

            return result;
        }
    }

    public class EmailTestResultDto
    {
        public string TestName { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Details { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
