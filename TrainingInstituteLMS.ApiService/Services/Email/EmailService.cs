using System.Globalization;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TrainingInstituteLMS.ApiService.Configuration;

namespace TrainingInstituteLMS.ApiService.Services.Email
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IOptions<EmailSettings> settings,
            ILogger<EmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendEnrollmentConfirmationAsync(
            string toEmail,
            string studentName,
            string studentEmail,
            string studentPhone,
            string? studentAddress,
            string courseName,
            string courseCode,
            DateTime? scheduledDate,
            TimeSpan? startTime,
            TimeSpan? endTime,
            string? location,
            string orderId,
            DateTime orderDate,
            decimal amountPaid,
            string paymentMethod,
            string loginId,
            string password)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping enrollment confirmation to {Email}", toEmail);
                return;
            }

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Cannot send enrollment confirmation - recipient email is empty");
                return;
            }

            // Format booking ID to exactly 8 digits for display in emails
            orderId = FormatBookingIdForEmail(orderId);

            try
            {
                var dateStr = scheduledDate.HasValue
                    ? scheduledDate.Value.ToString("dddd, d MMMM yyyy")
                    : "To be confirmed";
                var orderDateStr = orderDate.ToString("dddd, d MMMM yyyy");
                var priceStr = "$" + amountPaid.ToString("N2", CultureInfo.CreateSpecificCulture("en-US"));

                var timeStr = (startTime.HasValue && endTime.HasValue)
                    ? $"{DateTime.Today.Add(startTime.Value):h:mm tt} - {DateTime.Today.Add(endTime.Value):h:mm tt}"
                    : "To be confirmed";
                var locationStr = string.IsNullOrWhiteSpace(location)
                    ? "3/14-16 Marjorie Street, Sefton NSW 2162"
                    : location.Trim();

                var subject = $"Booking Confirmed - {courseName} (Order #{orderId})";

                var billingAddressPlain = string.IsNullOrWhiteSpace(studentAddress)
                    ? $"{studentName}\n{studentEmail}\n{studentPhone}"
                    : $"{studentName}\n{studentAddress.Trim()}\n{studentEmail}\n{studentPhone}";
                var billingAddressHtml = string.IsNullOrWhiteSpace(studentAddress)
                    ? $"{studentName}<br/>{studentEmail}<br/>{studentPhone}"
                    : $"{studentName}<br/>{studentAddress.Trim().Replace("\n", "<br/>")}<br/>{studentEmail}<br/>{studentPhone}";

                var plainBody = $@"Dear {studentName},

Thank you for booking with Safety Training Academy. Your booking has been successfully received!

Please find your course details below:

Course Name: {courseName}
Course Code: {courseCode}
Date: {dateStr}
Time: {timeStr}
Location: {locationStr}

What to Bring:
* Valid Photo ID (Driver Licence / Passport)
* USI Number (if required)
* Safety boots & appropriate workwear

------------------------------------------------------------
ORDER DETAILS (Order #{orderId})
------------------------------------------------------------
Order Date: {orderDateStr}
{courseName}                                   1    {priceStr}
Payment Method: {paymentMethod}
Total:                                                   {priceStr}

------------------------------------------------------------
STUDENT PORTAL LOGIN CREDENTIALS
------------------------------------------------------------
Login ID:  {loginId}
Password:  {password}

Use the above credentials to log in to the student portal to access your course materials and complete any required assessments.

Best regards,
{_settings.FromName}";

                var htmlBody = $@"<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>Booking Confirmation</title>
</head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr>
<td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr>
<td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;'>Booking Confirmed #{orderId}</h1>
</td>
</tr>
<tr>
<td style='padding:30px;'>
<p style='margin:0 0 16px;font-size:15px;color:#555;'>Dear <strong style='color:#333;'>{studentName}</strong>,</p>
<p style='margin:0 0 24px;font-size:15px;color:#555;'>Thank you for booking with <strong style='color:#333;'>Safety Training Academy</strong>. Your booking has been successfully received!</p>
<p style='margin:0 0 16px;font-size:14px;font-weight:600;color:#334155;'>Please find your course details below:</p>
<table width='100%' cellpadding='12' cellspacing='0' border='0' style='background-color:#f8fafc;border-radius:6px;margin-bottom:24px;border:1px solid #e2e8f0;'>
<tr><td style='font-size:13px;color:#64748b;width:120px;'>Course Name</td><td style='font-size:14px;font-weight:600;color:#334155;'>{courseName}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Course Code</td><td style='font-size:14px;font-weight:600;color:#334155;'>{courseCode}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Date</td><td style='font-size:14px;font-weight:600;color:#334155;'>{dateStr}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Time</td><td style='font-size:14px;font-weight:600;color:#334155;'>{timeStr}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Location</td><td style='font-size:14px;font-weight:600;color:#334155;'>{locationStr}</td></tr>
</table>
<div style='margin-bottom:24px;padding:16px;background-color:#fef3c7;border-radius:6px;border-left:4px solid #f59e0b;'>
<p style='margin:0 0 12px;font-size:13px;font-weight:700;color:#92400e;'>What to Bring:</p>
<ul style='margin:0;padding-left:20px;font-size:14px;color:#334155;'>
<li>Valid Photo ID (Driver Licence / Passport)</li>
<li>USI Number (if required)</li>
<li>Safety boots &amp; appropriate workwear</li>
</ul>
</div>
<!-- Order / Product box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:16px;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;border-bottom:1px solid #e2e8f0;'>
<p style='margin:0 0 4px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Product</p>
<p style='margin:0;font-size:15px;font-weight:600;color:#334155;'>{courseName}</p>
<p style='margin:4px 0 0;font-size:13px;color:#64748b;'>Booking ID: {orderId}</p>
<p style='margin:4px 0 0;font-size:13px;color:#64748b;'>Event: {courseName} | {dateStr} | {timeStr} ×1</p>
</td></tr>
<tr><td style='padding:16px 20px;'>
<table width='100%' cellpadding='4' cellspacing='0' border='0' style='font-size:14px;'>
<tr style='background-color:#f8fafc;'><td style='padding:8px 12px;color:#64748b;'>Quantity</td><td style='padding:8px 12px;text-align:right;font-weight:600;color:#334155;'>1</td></tr>
<tr><td style='padding:8px 12px;color:#64748b;'>Price</td><td style='padding:8px 12px;text-align:right;font-weight:600;color:#334155;'>{priceStr}</td></tr>
</table>
</td></tr>
</table>
<!-- Payment & Total box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Order Details (Order #{orderId})</p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order Date: <strong>{orderDateStr}</strong></p>
<table width='100%' cellpadding='4' cellspacing='0' border='0' style='font-size:14px;margin-top:12px;'>
<tr><td style='padding:8px 0;color:#334155;'>Subtotal</td><td style='padding:8px 0;text-align:right;font-weight:600;color:#334155;'>{priceStr}</td></tr>
<tr><td style='padding:8px 0;color:#334155;'>Payment method</td><td style='padding:8px 0;text-align:right;font-weight:600;color:#334155;'>{paymentMethod}</td></tr>
<tr style='border-top:2px solid #e2e8f0;'><td style='padding:12px 0 0;font-size:15px;font-weight:700;color:#334155;'>Total</td><td style='padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#334155;'>{priceStr}</td></tr>
</table>
</td></tr>
</table>
<!-- Billing address box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Billing address</p>
<p style='margin:0;font-size:14px;color:#334155;line-height:1.6;white-space:pre-line;'>{billingAddressHtml}</p>
</td></tr>
</table>
<!-- Login credentials box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;border:1px solid #3b82f6;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;background-color:#eff6ff;'>
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;'>Student Portal Login Credentials</p>
<p style='margin:0 0 6px;font-size:14px;color:#334155;'><strong>Login ID:</strong> {loginId}</p>
<p style='margin:0;font-size:14px;color:#334155;'><strong>Password:</strong> {password}</p>
</td></tr>
</table>
<p style='margin:0;font-size:14px;color:#555;'>Use the above credentials to log in to the student portal to access your course materials and complete any required assessments.</p>
</td>
</tr>
<tr>
<td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0;font-size:13px;color:#64748b;'>Best regards,<br/><strong style='color:#334155;'>{_settings.FromName}</strong></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>";

                // Build academy email (no login credentials - internal notification)
                var plainBodyAcademy = $@"NEW BOOKING RECEIVED #{orderId}

You have received a new booking from {studentName}

Order #: {orderId}
Order Date: {orderDateStr}

------------------------------------------------------------
Product                                    Qty    Price
------------------------------------------------------------
{courseName}                                   1    {priceStr}

------------------------------------------------------------
Subtotal:                                                {priceStr}
Payment Method: {paymentMethod}
Total:                                                   {priceStr}
------------------------------------------------------------

BILLING ADDRESS
{billingAddressPlain}

Course Date: {dateStr}

Congratulations on the sale. Please confirm your payment before scheduling the course.

Best regards,
{_settings.FromName}";

                var htmlBodyAcademy = $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>New Booking</title></head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;'>NEW BOOKING RECEIVED #{orderId}</h1>
</td></tr>
<tr><td style='padding:30px;'>
<p style='margin:0 0 20px;font-size:15px;color:#555;'>You have received a new booking from <strong style='color:#333;'>{studentName}</strong></p>
<!-- Product box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:16px;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;border-bottom:1px solid #e2e8f0;'>
<p style='margin:0 0 4px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Product</p>
<p style='margin:0;font-size:15px;font-weight:600;color:#334155;'>{courseName}</p>
<p style='margin:4px 0 0;font-size:13px;color:#64748b;'>Booking ID: {orderId}</p>
<p style='margin:4px 0 0;font-size:13px;color:#64748b;'>Event: {courseName} | {dateStr} | {timeStr} ×1</p>
</td></tr>
<tr><td style='padding:16px 20px;'>
<table width='100%' cellpadding='4' cellspacing='0' border='0' style='font-size:14px;'>
<tr style='background-color:#f8fafc;'><td style='padding:8px 12px;color:#64748b;'>Quantity</td><td style='padding:8px 12px;text-align:right;font-weight:600;color:#334155;'>1</td></tr>
<tr><td style='padding:8px 12px;color:#64748b;'>Price</td><td style='padding:8px 12px;text-align:right;font-weight:600;color:#334155;'>{priceStr}</td></tr>
</table>
</td></tr>
</table>
<!-- Order details box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:16px;background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Order Details (Order #{orderId})</p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order Date: <strong>{orderDateStr}</strong></p>
<table width='100%' cellpadding='4' cellspacing='0' border='0' style='font-size:14px;margin-top:12px;'>
<tr><td style='padding:8px 0;color:#334155;'>Subtotal</td><td style='padding:8px 0;text-align:right;font-weight:600;color:#334155;'>{priceStr}</td></tr>
<tr><td style='padding:8px 0;color:#334155;'>Payment method</td><td style='padding:8px 0;text-align:right;font-weight:600;color:#334155;'>{paymentMethod}</td></tr>
<tr style='border-top:2px solid #e2e8f0;'><td style='padding:12px 0 0;font-size:15px;font-weight:700;color:#334155;'>Total</td><td style='padding:12px 0 0;text-align:right;font-size:15px;font-weight:700;color:#334155;'>{priceStr}</td></tr>
</table>
</td></tr>
</table>
<!-- Billing address box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Billing address</p>
<p style='margin:0;font-size:14px;color:#334155;line-height:1.6;'>{billingAddressHtml}</p>
</td></tr>
</table>
</td></tr>
<tr><td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0 0 12px;font-size:14px;color:#334155;font-weight:600;'>Congratulations on the sale. Please confirm your payment before scheduling the course.</p>
<p style='margin:0;font-size:13px;color:#64748b;'>Best regards,<br/><strong style='color:#334155;'>{_settings.FromName}</strong></p>
</td></tr></table></td></tr></table></body></html>";

                // Trim credentials; remove spaces from Gmail App Password (16-char format)
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();

                _logger.LogInformation("Email: Attempting to send enrollment confirmation to {ToEmail} (order {OrderId}) via {Host}:{Port}", toEmail, orderId, _settings.SmtpHost, _settings.SmtpPort);

                using var client = new SmtpClient();
                try
                {
                    await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.Auto);
                    _logger.LogInformation("Email: SMTP connected to {Host}:{Port}", _settings.SmtpHost, _settings.SmtpPort);
                }
                catch (Exception connectEx)
                {
                    _logger.LogError(connectEx, "Email: SMTP Connect failed to {Host}:{Port}. Error: {Message}", _settings.SmtpHost, _settings.SmtpPort, connectEx.Message);
                    throw;
                }

                try
                {
                    await client.AuthenticateAsync(user, smtpPassword);
                    _logger.LogInformation("Email: SMTP authenticated as {User}", user);
                }
                catch (Exception authEx)
                {
                    _logger.LogError(authEx, "Email: SMTP Authentication failed for {User}. Error: {Message}. Check App Password and 2FA settings.", user, authEx.Message);
                    throw;
                }

                try
                {
                    // 1. Send to academy bookings email (best-effort; failure does not block student email)
                    if (!string.IsNullOrWhiteSpace(_settings.BookingsEmail))
                    {
                        try
                        {
                            var msgAcademy = new MimeMessage();
                            msgAcademy.From.Add(new MailboxAddress(_settings.FromName, user));
                            msgAcademy.To.Add(MailboxAddress.Parse(_settings.BookingsEmail.Trim()));
                            msgAcademy.Subject = $"New Booking #{orderId} - {studentName} - {courseName}";
                            msgAcademy.Body = new BodyBuilder { TextBody = plainBodyAcademy, HtmlBody = htmlBodyAcademy }.ToMessageBody();
                            await client.SendAsync(msgAcademy);
                            _logger.LogInformation("Email: Enrollment notification sent to academy {Email} for order {OrderId}", _settings.BookingsEmail, orderId);
                        }
                        catch (Exception academyEx)
                        {
                            _logger.LogWarning(academyEx, "Email: Failed to send academy notification to {Email} for order {OrderId}. Error: {Message}. Continuing to send student confirmation.", _settings.BookingsEmail, orderId, academyEx.Message);
                        }
                    }

                    // 2. Send to student (with login credentials) - critical path
                    var msgStudent = new MimeMessage();
                    msgStudent.From.Add(new MailboxAddress(_settings.FromName, user));
                    msgStudent.To.Add(MailboxAddress.Parse(toEmail.Trim()));
                    msgStudent.Subject = subject;
                    msgStudent.Body = new BodyBuilder { TextBody = plainBody, HtmlBody = htmlBody }.ToMessageBody();
                    await client.SendAsync(msgStudent);
                    _logger.LogInformation("Email: Enrollment confirmation sent to student {Email} for course {CourseName}", toEmail, courseName);
                }
                finally
                {
                    try
                    {
                        await client.DisconnectAsync(true);
                        _logger.LogInformation("Email: SMTP disconnected");
                    }
                    catch (Exception disconnectEx)
                    {
                        _logger.LogWarning(disconnectEx, "Email: SMTP disconnect warning: {Message}", disconnectEx.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? $" Inner: {ex.InnerException.Message}" : "";
                _logger.LogError(ex, "Email: Failed to send enrollment confirmation to {Email}. Error: {Message}{InnerMessage}", toEmail, ex.Message, innerMsg);
                // Do not throw - enrollment already succeeded
            }
        }

        /// <summary>
        /// Formats the booking/order ID to exactly 8 digits for display in emails.
        /// Extracts digits and pads or truncates to 8 characters.
        /// </summary>
        private static string FormatBookingIdForEmail(string orderId)
        {
            if (string.IsNullOrWhiteSpace(orderId)) return orderId ?? string.Empty;
            var digits = new string(orderId.Where(char.IsDigit).ToArray());
            if (digits.Length >= 8)
                return digits[^8..];
            if (digits.Length > 0)
                return digits.PadLeft(8, '0');
            // Fallback: take last 8 chars if no digits (e.g. alphanumeric ID)
            return orderId.Length <= 8 ? orderId.Trim() : orderId.Trim()[^8..];
        }
    }
}
