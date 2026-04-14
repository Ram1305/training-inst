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

        public async Task SendCompanyOrderConfirmationAsync(
            string toEmail,
            string companyName,
            string orderId,
            decimal totalAmount,
            List<(string CourseName, string FullUrl, string CourseDateDisplay)> links,
            bool accountCreated,
            string? loginBaseUrl)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping company order confirmation to {Email}", toEmail);
                return;
            }
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Cannot send company order confirmation - recipient email is empty");
                return;
            }

            orderId = FormatBookingIdForEmail(orderId);
            var priceStr = "$" + totalAmount.ToString("N2", CultureInfo.CreateSpecificCulture("en-US"));
            var orderDateStr = DateTime.UtcNow.ToString("dddd, d MMMM yyyy");

            var linksPlain = string.Join("\n", links.Select((l, i) => $"{i + 1}. {l.CourseName}\n   Date: {l.CourseDateDisplay}\n   {l.FullUrl}"));
            var linksHtml = string.Join("", links.Select((l, i) => $@"
<tr><td style='padding:12px 16px;border-bottom:1px solid #e2e8f0;'>
<p style='margin:0 0 4px;font-size:14px;font-weight:600;color:#334155;'>{l.CourseName}</p>
<p style='margin:0 0 4px;font-size:13px;color:#64748b;'>Selected date: {l.CourseDateDisplay}</p>
<p style='margin:0;font-size:13px;'><a href='{l.FullUrl}' style='color:#3b82f6;word-break:break-all;'>{l.FullUrl}</a></p>
</td></tr>"));

            var loginNotePlain = accountCreated && !string.IsNullOrWhiteSpace(loginBaseUrl)
                ? $"\n\nYou can log in at {loginBaseUrl.TrimEnd('/')} with this email and your password to manage your company account.\n"
                : "";
            var loginNoteHtml = accountCreated && !string.IsNullOrWhiteSpace(loginBaseUrl)
                ? $@"<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:20px;background-color:#eff6ff;border-radius:8px;border:1px solid #3b82f6;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;'>Company portal login</p>
<p style='margin:0;font-size:14px;color:#334155;'>You can log in at <a href='{loginBaseUrl.TrimEnd('/')}' style='color:#3b82f6;'>{loginBaseUrl.TrimEnd('/')}</a> with this email and your password to manage your company account.</p>
</td></tr></table>"
                : "";

            var subject = $"Thank you for your booking – Order #{orderId}";

            // Academy notification content (New Company Booking - internal notification)
            var plainBodyAcademy = $@"NEW COMPANY BOOKING RECEIVED #{orderId}

You have received a new company booking from {companyName} ({toEmail}).

Order #: {orderId}
Order Date: {orderDateStr}
Total: {priceStr}

------------------------------------------------------------
Courses / Employee Links:
------------------------------------------------------------
{string.Join("\n", links.Select((l, i) => $"{i + 1}. {l.CourseName}\n   Date: {l.CourseDateDisplay}\n   {l.FullUrl}"))}

------------------------------------------------------------

Please follow up with the company for payment confirmation if required.

Best regards,
{_settings.FromName}";

            var linksHtmlAcademy = string.Join("", links.Select((l, i) => $@"
<tr><td style='padding:12px 16px;border-bottom:1px solid #e2e8f0;'>
<p style='margin:0 0 4px;font-size:14px;font-weight:600;color:#334155;'>{l.CourseName}</p>
<p style='margin:0 0 4px;font-size:13px;color:#64748b;'>Selected date: {l.CourseDateDisplay}</p>
<p style='margin:0;font-size:13px;'><a href='{l.FullUrl}' style='color:#3b82f6;word-break:break-all;'>{l.FullUrl}</a></p>
</td></tr>"));

            var htmlBodyAcademy = $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>New Company Booking</title></head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;'>NEW COMPANY BOOKING #{orderId}</h1>
</td></tr>
<tr><td style='padding:30px;'>
<p style='margin:0 0 20px;font-size:15px;color:#555;'>You have received a new company booking from <strong style='color:#333;'>{companyName}</strong> (<a href='mailto:{toEmail}' style='color:#3b82f6;'>{toEmail}</a>)</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Order details</p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order #: <strong>{orderId}</strong></p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order date: <strong>{orderDateStr}</strong></p>
<p style='margin:0;font-size:14px;color:#334155;'>Total: <strong>{priceStr}</strong></p>
</td></tr></table>
<p style='margin:0 0 12px;font-size:14px;font-weight:600;color:#334155;'>Courses / Employee links:</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;'>{linksHtmlAcademy}
</table>
<p style='margin:16px 0 0;font-size:14px;color:#334155;'>Please follow up with the company for payment confirmation if required.</p>
</td></tr>
<tr><td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0;font-size:13px;color:#64748b;'>Best regards,<br/><strong style='color:#334155;'>{_settings.FromName}</strong></p>
</td></tr></table></td></tr></table></body></html>";

            var plainBody = $@"Dear {companyName},

Thank you for your booking with Safety Training Academy.

Instructions:
Please share the links with your employees to continue their LLN (Language, Literacy and Numeracy) assessment and complete their Enrolment.

Please share the links below:

{linksPlain}

Please ask them to complete the form and assessment before their course date to finalise your registration.

We have shared these details in Email for your reference and confirmation.

Order #: {orderId}
Order Date: {orderDateStr}
Total: {priceStr}

If you need any assistance, please contact us.
{loginNotePlain}
Kind regards,
Safety Training Academy
Training Team
1300 976 097
info@safetytrainingacademy.edu.au";

            var htmlBody = $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Booking Confirmation</title></head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;'>Thank you for your booking – Order #{orderId}</h1>
</td></tr>
<tr><td style='padding:30px;'>
<p style='margin:0 0 16px;font-size:15px;color:#555;'>Dear <strong>{companyName}</strong>,</p>
<p style='margin:0 0 24px;font-size:15px;color:#555;'>Thank you for your booking with Safety Training Academy.</p>
<p style='margin:0 0 12px;font-size:14px;font-weight:600;color:#334155;'>Instructions:</p>
<p style='margin:0 0 16px;font-size:14px;color:#334155;'>Please share the links with your employees to continue their LLN (Language, Literacy and Numeracy) assessment and complete their Enrolment.</p>
<p style='margin:0 0 12px;font-size:14px;font-weight:600;color:#334155;'>Please share the links below:</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;'>{linksHtml}
</table>
<p style='margin:0 0 16px;font-size:14px;color:#334155;'>Please ask them to complete the form and assessment before their course date to finalise your registration.</p>
<p style='margin:0 0 20px;font-size:14px;color:#334155;'>We have shared these details in Email for your reference and confirmation.</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Order details</p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order #: <strong>{orderId}</strong></p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Order date: <strong>{orderDateStr}</strong></p>
<p style='margin:0;font-size:14px;color:#334155;'>Total: <strong>{priceStr}</strong></p>
</td></tr></table>
<p style='margin:0 0 20px;font-size:14px;color:#334155;'>If you need any assistance, please contact us.</p>
{loginNoteHtml}
</td></tr>
<tr><td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0;font-size:13px;color:#64748b;'>Kind regards,<br/><strong style='color:#334155;'>Safety Training Academy</strong><br/>Training Team<br/>1300 976 097<br/><a href='mailto:info@safetytrainingacademy.edu.au' style='color:#3b82f6;'>info@safetytrainingacademy.edu.au</a></p>
</td></tr></table></td></tr></table></body></html>";

            try
            {
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
                using var client = new SmtpClient();
                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                await client.AuthenticateAsync(user, smtpPassword);

                try
                {
                // 1. Send to academy bookings email (best-effort; failure does not block company email)
                if (!string.IsNullOrWhiteSpace(_settings.BookingsEmail))
                {
                    try
                    {
                        var msgAcademy = new MimeMessage();
                        msgAcademy.From.Add(new MailboxAddress(_settings.FromName, user));
                        msgAcademy.To.Add(MailboxAddress.Parse(_settings.BookingsEmail.Trim()));
                        msgAcademy.Subject = $"New Company Booking #{orderId} - {companyName}";
                        msgAcademy.Body = new BodyBuilder { TextBody = plainBodyAcademy, HtmlBody = htmlBodyAcademy }.ToMessageBody();
                        await client.SendAsync(msgAcademy);
                        _logger.LogInformation("Email: Company order notification sent to academy {Email} for order {OrderId}", _settings.BookingsEmail, orderId);
                    }
                    catch (Exception academyEx)
                    {
                        _logger.LogWarning(academyEx, "Email: Failed to send academy company order notification to {Email} for order {OrderId}. Error: {Message}. Continuing to send company confirmation.", _settings.BookingsEmail, orderId, academyEx.Message);
                    }
                }

                // 2. Send to company (confirmation with links)
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_settings.FromName, user));
                message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
                message.Subject = subject;
                message.Body = new BodyBuilder { TextBody = plainBody, HtmlBody = htmlBody }.ToMessageBody();
                await client.SendAsync(message);
                _logger.LogInformation("Company order confirmation sent to {Email} for order {OrderId}", toEmail, orderId);
                }
                finally
                {
                    try
                    {
                        await client.DisconnectAsync(true);
                    }
                    catch (Exception disconnectEx)
                    {
                        _logger.LogWarning(disconnectEx, "Email: SMTP disconnect warning: {Message}", disconnectEx.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send company order confirmation to {Email} for order {OrderId}", toEmail, orderId);
            }
        }

        public async Task SendEnrollmentLinkRegistrationConfirmationAsync(
            string toEmail,
            string studentName,
            string courseName,
            string? courseCode,
            DateTime? scheduledDate,
            TimeSpan? startTime,
            TimeSpan? endTime,
            string? location,
            string loginBaseUrl)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping enrollment link registration confirmation to {Email}", toEmail);
                return;
            }
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Cannot send enrollment link registration confirmation - recipient email is empty");
                return;
            }

            var dateStr = scheduledDate.HasValue
                ? scheduledDate.Value.ToString("dddd, d MMMM yyyy")
                : "To be confirmed";
            var timeStr = (startTime.HasValue && endTime.HasValue)
                ? $"{DateTime.Today.Add(startTime.Value):h:mm tt} - {DateTime.Today.Add(endTime.Value):h:mm tt}"
                : "To be confirmed";
            var locationStr = string.IsNullOrWhiteSpace(location)
                ? "3/14-16 Marjorie Street, Sefton NSW 2162"
                : location.Trim();
            var loginUrl = (loginBaseUrl ?? "").TrimEnd('/');

            var subject = $"Registration complete – {courseName}";
            var plainBody = $@"Dear {studentName},

You have successfully completed your registration via the enrollment link.

Your course details:

Course: {courseName}
{(courseCode != null ? $"Course Code: {courseCode}\n" : "")}Date: {dateStr}
Time: {timeStr}
Location: 3/14-16 Marjorie Street, Sefton NSW 2162

You can log in to the student portal at {loginUrl} using this email address and the password you just set.

If you need any assistance, please contact us.

Kind regards,
Safety Training Academy
1300 976 097
info@safetytrainingacademy.edu.au";

            var courseCodeRow = !string.IsNullOrWhiteSpace(courseCode)
                ? $@"<tr><td style='font-size:13px;color:#64748b;'>Course Code</td><td style='font-size:14px;font-weight:600;color:#334155;'>{courseCode}</td></tr>"
                : "";
            var htmlBody = $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Registration complete</title></head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;'>Registration complete – {courseName}</h1>
</td></tr>
<tr><td style='padding:30px;'>
<p style='margin:0 0 16px;font-size:15px;color:#555;'>Dear <strong>{studentName}</strong>,</p>
<p style='margin:0 0 24px;font-size:15px;color:#555;'>You have successfully completed your registration via the enrollment link.</p>
<p style='margin:0 0 12px;font-size:14px;font-weight:600;color:#334155;'>Your course details:</p>
<table width='100%' cellpadding='12' cellspacing='0' border='0' style='background-color:#f8fafc;border-radius:6px;margin-bottom:24px;border:1px solid #e2e8f0;'>
<tr><td style='font-size:13px;color:#64748b;width:120px;'>Course</td><td style='font-size:14px;font-weight:600;color:#334155;'>{courseName}</td></tr>
{courseCodeRow}
<tr><td style='font-size:13px;color:#64748b;'>Date</td><td style='font-size:14px;font-weight:600;color:#334155;'>{dateStr}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Time</td><td style='font-size:14px;font-weight:600;color:#334155;'>{timeStr}</td></tr>
<tr><td style='font-size:13px;color:#64748b;'>Location</td><td style='font-size:14px;font-weight:600;color:#334155;'>3/14-16 Marjorie Street, Sefton NSW 2162</td></tr>
</table>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-top:20px;background-color:#eff6ff;border-radius:8px;border:1px solid #3b82f6;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;'>Student portal login</p>
<p style='margin:0;font-size:14px;color:#334155;'>You can log in at <a href='{loginUrl}' style='color:#3b82f6;'>{loginUrl}</a> using this email address and the password you just set.</p>
</td></tr></table>
<p style='margin:20px 0 0;font-size:14px;color:#334155;'>If you need any assistance, please contact us.</p>
</td></tr>
<tr><td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0;font-size:13px;color:#64748b;'>Kind regards,<br/><strong style='color:#334155;'>Safety Training Academy</strong><br/>1300 976 097<br/><a href='mailto:info@safetytrainingacademy.edu.au' style='color:#3b82f6;'>info@safetytrainingacademy.edu.au</a></p>
</td></tr></table></td></tr></table></body></html>";

            // Academy notification body
            var plainBodyAcademy = $@"NEW REGISTRATION RECEIVED (VIA LINK)

Dear Team,

A new student has registered and enrolled via an enrollment link.

Student Details:
Name: {studentName}
Email: {toEmail}

Course Details:
Course: {courseName}
Date: {dateStr}
Time: {timeStr}
Location: 3/14-16 Marjorie Street, Sefton NSW 2162

Best regards,
{_settings.FromName}";

            var htmlBodyAcademy = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333;'>
<div style='background-color:#4f46e5;color:#ffffff;padding:20px;text-align:center;border-radius:8px 8px 0 0;'>
  <h1 style='margin:0;font-size:20px;'>New Registration Received</h1>
</div>
<div style='padding:20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;'>
  <p>Dear Team,</p>
  <p>A new student has registered and enrolled via an enrollment link.</p>
  <table width='100%' cellpadding='8' cellspacing='0' style='background-color:#f8fafc;border-radius:6px;margin-bottom:20px;'>
    <tr><td style='color:#64748b;width:120px;'>Student Name</td><td><strong>{studentName}</strong></td></tr>
    <tr><td style='color:#64748b;'>Student Email</td><td>{toEmail}</td></tr>
    <tr><td style='color:#64748b;'>Course</td><td>{courseName}</td></tr>
    <tr><td style='color:#64748b;'>Date</td><td>{dateStr}</td></tr>
    <tr><td style='color:#64748b;'>Time</td><td>{timeStr}</td></tr>
  </table>
  <p>Best regards,<br/>{_settings.FromName}</p>
</div>
</body>
</html>";

            try
            {
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

                _logger.LogInformation("Email: Attempting to send registration confirmation to {Email} (link) via {Host}:{Port}", toEmail, _settings.SmtpHost, _settings.SmtpPort);

                using var client = new SmtpClient();
                try
                {
                    await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                    _logger.LogInformation("Email: SMTP connected for link registration");
                }
                catch (Exception connectEx)
                {
                    _logger.LogError(connectEx, "Email: SMTP Connect failed for link registration to {Host}:{Port}", _settings.SmtpHost, _settings.SmtpPort);
                    throw;
                }

                try
                {
                    await client.AuthenticateAsync(user, smtpPassword);
                }
                catch (Exception authEx)
                {
                    _logger.LogError(authEx, "Email: SMTP Authentication failed for link registration for {User}", user);
                    throw;
                }

                try
                {
                    // 1. Send to academy bookings email (best-effort)
                    if (!string.IsNullOrWhiteSpace(_settings.BookingsEmail))
                    {
                        try
                        {
                            var msgAcademy = new MimeMessage();
                            msgAcademy.From.Add(new MailboxAddress(_settings.FromName, user));
                            msgAcademy.To.Add(MailboxAddress.Parse(_settings.BookingsEmail.Trim()));
                            msgAcademy.Subject = $"NEW REGISTRATION (LINK) - {studentName} - {courseName}";
                            msgAcademy.Body = new BodyBuilder { TextBody = plainBodyAcademy, HtmlBody = htmlBodyAcademy }.ToMessageBody();
                            await client.SendAsync(msgAcademy);
                            _logger.LogInformation("Email: Registration notification sent to academy for {Email}", toEmail);
                        }
                        catch (Exception academyEx)
                        {
                            _logger.LogWarning(academyEx, "Email: Failed to send academy notification for link registration for {Email}", toEmail);
                        }
                    }

                    // 2. Send to student
                    var message = new MimeMessage();
                    message.From.Add(new MailboxAddress(_settings.FromName, user));
                    message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
                    message.Subject = subject;
                    message.Body = new BodyBuilder { TextBody = plainBody, HtmlBody = htmlBody }.ToMessageBody();
                    await client.SendAsync(message);
                    _logger.LogInformation("Email: Registration confirmation sent to student {Email} via link", toEmail);
                }
                finally
                {
                    try
                    {
                        await client.DisconnectAsync(true);
                        _logger.LogInformation("Email: SMTP disconnected after link registration");
                    }
                    catch (Exception discEx)
                    {
                        _logger.LogWarning(discEx, "Email: SMTP Disconnect error after link registration");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send enrollment link registration confirmation to {Email}", toEmail);
            }
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
            string password,
            bool hideOrderAndPriceDetails)
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

                // Official links for Course Preparation Checklist
                const string urlCreateUsi = "https://www.usi.gov.au/your-usi/create-usi";
                const string urlFindUsi = "https://www.usi.gov.au/faqs/find-your-usi";
                const string urlApplyAen = "https://www.service.nsw.gov.au/transaction/apply-for-a-high-risk-work-licence-assessment-enrolment-number";
                const string urlProofOfIdentity = "https://www.safework.nsw.gov.au/licences-and-registrations/licences/proof-of-identity";
                const string urlEvidenceOfIdentity = "https://www.safework.nsw.gov.au/licences-and-registrations/licences/evidence-of-identity";

                var billingAddressPlain = string.IsNullOrWhiteSpace(studentAddress)
                    ? $"{studentName}\n{studentEmail}\n{studentPhone}"
                    : $"{studentName}\n{studentAddress.Trim()}\n{studentEmail}\n{studentPhone}";
                var billingAddressHtml = string.IsNullOrWhiteSpace(studentAddress)
                    ? $"{studentName}<br/>{studentEmail}<br/>{studentPhone}"
                    : $"{studentName}<br/>{studentAddress.Trim().Replace("\n", "<br/>")}<br/>{studentEmail}<br/>{studentPhone}";

                var bankDetailsPlain = (paymentMethod == "Bank Transfer" || paymentMethod == "bank_transfer") ? $@"
------------------------------------------------------------
BANK TRANSFER DETAILS
------------------------------------------------------------
Bank: Commonwealth Bank
Account Name: AIET College
BSB: 062 141
Account No: 10490235
Please use your order number #{orderId} or your full name as the payment reference.
" : "";

                var bankDetailsHtml = (paymentMethod == "Bank Transfer" || paymentMethod == "bank_transfer") ? $@"
<!-- Bank Details box -->
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#fffbeb;border-radius:8px;border:1px solid #fcd34d;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;'>Bank Transfer Details</p>
<table width='100%' cellpadding='4' cellspacing='0' border='0' style='font-size:14px;color:#92400e;'>
<tr><td style='padding:4px 0;width:120px;'>Bank</td><td style='padding:4px 0;'><strong>Commonwealth Bank</strong></td></tr>
<tr><td style='padding:4px 0;'>Account Name</td><td style='padding:4px 0;'><strong>AIET College</strong></td></tr>
<tr><td style='padding:4px 0;'>BSB</td><td style='padding:4px 0;'><strong>062 141</strong></td></tr>
<tr><td style='padding:4px 0;'>Account No</td><td style='padding:4px 0;'><strong>10490235</strong></td></tr>
</table>
<p style='margin:12px 0 0;font-size:13px;color:#b45309;'>Please use your order number <strong>#{orderId}</strong> or your full name as the payment reference.</p>
</td></tr>
</table>" : "";

                var plainBody = $@"Dear {studentName},

Thank you for booking with Safety Training Academy. Your booking has been successfully received!

Please find your course details below:

Course Name: {courseName}
Course Code: {courseCode}
Date: {dateStr}
Time: {timeStr}
Location: 3/14-16 Marjorie Street, Sefton NSW 2162

------------------------------------------------------------
IMPORTANT: COURSE PREPARATION CHECKLIST
------------------------------------------------------------
Course Address: 3/14-16 Marjorie Street, Sefton NSW 2162

Prior to the commencement of your course, please ensure you bring the following items:

* ID reflecting your name and address.
* Personal Protective Equipment (PPE), including a high visibility vest and steel cap boots (safety shoes). (Not required for First Aid courses.)
* Unique Student Identifier (USI):
  - Create USI: {urlCreateUsi}
  - Find your USI (if you've forgotten it): {urlFindUsi}

Additional requirements if you booked for High-Risk licence (Forklift and Boom lift over 11 meters):
* 100 Points ID reflecting your name and address. Refer to the link below:
  Proof of Identification: {urlProofOfIdentity}
* Assessment Enrolment Number (AEN):
  You can create it using the provided link:
  Apply for AEN: {urlApplyAen}

Additional requirement if you booked for White Card,Asbestos:
* 100 Points ID reflecting your name and address: {urlEvidenceOfIdentity}

Safety Training Academy also provides the following facilities for your convenience:
* Beverages (coffee, tea, hot chocolate, water).
* Adequate facilities include a lunchroom, toilets, and a fridge in the kitchen room.
* Easy council parking.

Notes:
Ensure you arrive prepared with the necessary items and documentation for your training session.
If you have any additional questions or concerns, please don't hesitate to contact Safety Training Academy for clarification.
{bankDetailsPlain}";

                if (!hideOrderAndPriceDetails)
                {
                    plainBody += $@"

------------------------------------------------------------
ORDER DETAILS (Order #{orderId})
------------------------------------------------------------
Order Date: {orderDateStr}
{courseName}                                   1    {priceStr}
Payment Method: {paymentMethod}
Total:                                                   {priceStr}
";
                }

                plainBody += $@"

------------------------------------------------------------
STUDENT PORTAL LOGIN CREDENTIALS
------------------------------------------------------------
Login ID:  {loginId}
Password:  {password}

Use the above credentials to log in to the student portal to access your course materials and complete any required assessments.

------------------------------------------------------------
CONTACT DETAILS
------------------------------------------------------------
Office: info@safetytrainingacademy.edu.au
Booking: bookings@safetytrainingacademy.edu.au
Business: 1300 976 097  |  M: 0483 878 887

Best regards,
{_settings.FromName}";

                var orderAndProductHtml = hideOrderAndPriceDetails
                    ? ""
                    : $@"
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
</table>";

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
<tr><td style='font-size:13px;color:#64748b;'>Location</td><td style='font-size:14px;font-weight:600;color:#334155;'>3/14-16 Marjorie Street, Sefton NSW 2162</td></tr>
</table>
<div style='margin-bottom:24px;padding:16px;background-color:#fef3c7;border-radius:6px;border-left:4px solid #f59e0b;'>
<p style='margin:0 0 12px;font-size:13px;font-weight:700;color:#92400e;'>Important: Course Preparation Checklist</p>
<p style='margin:0 0 8px;font-size:13px;color:#334155;'>Course Address: <strong>3/14-16 Marjorie Street, Sefton NSW 2162</strong></p>
<p style='margin:0 0 8px;font-size:13px;color:#334155;'>Prior to the commencement of your course, please ensure you bring the following items:</p>
<ul style='margin:0 0 12px;padding-left:20px;font-size:14px;color:#334155;'>
<li>ID reflecting your name and address.</li>
<li>Personal Protective Equipment (PPE), including a high visibility vest and steel cap boots (safety shoes). <em>(Not required for First Aid courses.)</em></li>
<li><strong>Unique Student Identifier (USI):</strong><br/>
  <a href='{urlCreateUsi}' style='color:#3b82f6;'>Create USI</a> &nbsp;|&nbsp; <a href='{urlFindUsi}' style='color:#3b82f6;'>Find your USI</a> (if you&apos;ve forgotten it)</li>
</ul>
<p style='margin:0 0 6px;font-size:13px;font-weight:600;color:#334155;'>Additional requirements if you booked for High-Risk licence (Forklift and Boom lift over 11 meters):</p>
<ul style='margin:0 0 12px;padding-left:20px;font-size:14px;color:#334155;'>
<li>100 Points ID reflecting your name and address. Refer to the link below:<br/><a href='{urlProofOfIdentity}' style='color:#3b82f6;'>Proof of Identification</a></li>
<li>Assessment Enrolment Number (AEN):<br/>You can create it using the provided link:<br/><a href='{urlApplyAen}' style='color:#3b82f6;'>Apply for AEN</a></li>
</ul>
<p style='margin:0 0 6px;font-size:13px;font-weight:600;color:#334155;'>Additional requirement if you booked for White Card:</p>
<ul style='margin:0 0 12px;padding-left:20px;font-size:14px;color:#334155;'>
<li>100 Points ID: <a href='{urlEvidenceOfIdentity}' style='color:#3b82f6;'>Evidence of Identity</a></li>
</ul>
<p style='margin:0 0 6px;font-size:13px;font-weight:600;color:#334155;'>Safety Training Academy also provides:</p>
<ul style='margin:0 0 12px;padding-left:20px;font-size:14px;color:#334155;'>
<li>Beverages (coffee, tea, hot chocolate, water).</li>
<li>Lunchroom, toilets, and a fridge in the kitchen room.</li>
<li>Easy council parking.</li>
</ul>
<p style='margin:0;font-size:13px;color:#334155;'><strong>Notes:</strong> Ensure you arrive prepared with the necessary items and documentation. If you have any questions, contact Safety Training Academy for clarification.</p>
</div>
{bankDetailsHtml}
{orderAndProductHtml}
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
<p style='margin:0 0 20px;font-size:14px;color:#555;'>Use the above credentials to log in to the student portal to access your course materials and complete any required assessments.</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:24px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Contact Details</p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Office: <a href='mailto:info@safetytrainingacademy.edu.au' style='color:#3b82f6;'>info@safetytrainingacademy.edu.au</a></p>
<p style='margin:0 0 4px;font-size:14px;color:#334155;'>Booking: <a href='mailto:bookings@safetytrainingacademy.edu.au' style='color:#3b82f6;'>bookings@safetytrainingacademy.edu.au</a></p>
<p style='margin:0;font-size:14px;color:#334155;'>Business: 1300 976 097 &nbsp;|&nbsp; M: 0483 878 887</p>
</td></tr></table>
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

                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;
                using var client = new SmtpClient();
                try
                {
                    await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                    _logger.LogInformation("Email: SMTP connected to {Host}:{Port} using {Options}", _settings.SmtpHost, _settings.SmtpPort, socketOptions);
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

        public async Task SendVOCSubmissionConfirmationAsync(
            string toEmail,
            string firstName,
            string lastName,
            string submissionId,
            decimal amountPaid,
            string paymentMethod,
            string selectedCoursesJson)
        {
            if (!_settings.IsConfigured || string.IsNullOrWhiteSpace(toEmail)) return;

            var subject = $"VOC Submission Received - #{submissionId.Substring(0, 8)}";
            var priceStr = "$" + amountPaid.ToString("N2", CultureInfo.CreateSpecificCulture("en-US"));
            
            var plainBody = $@"Dear {firstName} {lastName},

Thank you for your VOC submission to Safety Training Academy.

Your submission details:
ID: {submissionId.Substring(0, 8)}
Amount: {priceStr}
Payment Method: {paymentMethod}

We have received your request and will process it shortly.

Kind regards,
Safety Training Academy";

            var htmlBody = $@"<!DOCTYPE html><html><body>
<h2>VOC Submission Confirmation</h2>
<p>Dear {firstName} {lastName},</p>
<p>Thank you for your VOC submission. We have received your request.</p>
<table border='0' cellpadding='8' cellspacing='0'>
<tr><td><strong>Submission ID:</strong></td><td>{submissionId.Substring(0, 8)}</td></tr>
<tr><td><strong>Amount Paid:</strong></td><td>{priceStr}</td></tr>
<tr><td><strong>Payment Method:</strong></td><td>{paymentMethod}</td></tr>
</table>
<p>Our team will review your application and get back to you soon.</p>
<p>Best regards,<br/><strong>Safety Training Academy</strong></p>
</body></html>";


            var user = _settings.User?.Trim() ?? string.Empty;
            var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
            var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

            _logger.LogInformation("Email: Attempting to send VOC submission confirmation to {Email} for submission {Id} via {Host}:{Port}", toEmail, submissionId, _settings.SmtpHost, _settings.SmtpPort);

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                _logger.LogInformation("Email: SMTP connected to {Host}:{Port} using {Options} for VOC submission", _settings.SmtpHost, _settings.SmtpPort, socketOptions);

                await client.AuthenticateAsync(user, smtpPassword);
                _logger.LogInformation("Email: SMTP authenticated as {User} for VOC submission", user);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_settings.FromName, user));
                message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
                message.Subject = subject;
                message.Body = new BodyBuilder { TextBody = plainBody, HtmlBody = htmlBody }.ToMessageBody();

                await client.SendAsync(message);
                _logger.LogInformation("Email: VOC submission confirmation sent to {Email} for submission {Id}", toEmail, submissionId);

                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? $" Inner: {ex.InnerException.Message}" : "";
                _logger.LogError(ex, "Email: Failed to send VOC confirmation to {Email}. Error: {Message}{InnerMessage}", toEmail, ex.Message, innerMsg);
                throw;
            }
        }

        public async Task SendEmailOTPAsync(string toEmail, string otp)
        {
            if (!_settings.IsConfigured || string.IsNullOrWhiteSpace(toEmail)) return;

            var subject = $"{otp} is your verification code";
            var plainBody = $"Your verification code for VOC submission is: {otp}. It will expire in 10 minutes.";
            var htmlBody = $@"<!DOCTYPE html><html><body>
<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
<h2 style='color: #4f46e5;'>Verify your email</h2>
<p>Use the following code to verify your email address for VOC submission:</p>
<div style='background-color: #f3f4f6; padding: 15px; border-radius: 4px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #1f2937;'>{otp}</div>
<p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
</div></body></html>";

            var user = _settings.User?.Trim() ?? string.Empty;
            var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
            var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

            _logger.LogInformation("Email: Attempting to send OTP email to {Email} via {Host}:{Port}", toEmail, _settings.SmtpHost, _settings.SmtpPort);

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                _logger.LogInformation("Email: SMTP connected to {Host}:{Port} using {Options} for OTP", _settings.SmtpHost, _settings.SmtpPort, socketOptions);

                await client.AuthenticateAsync(user, smtpPassword);
                _logger.LogInformation("Email: SMTP authenticated as {User} for OTP", user);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_settings.FromName, user));
                message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
                message.Subject = subject;
                message.Body = new BodyBuilder { TextBody = plainBody, HtmlBody = htmlBody }.ToMessageBody();
                
                await client.SendAsync(message);
                _logger.LogInformation("Email: OTP email successfully sent to {Email}", toEmail);

                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? $" Inner: {ex.InnerException.Message}" : "";
                _logger.LogError(ex, "Email: Failed to send OTP email to {Email}. Error: {Message}{InnerMessage}", toEmail, ex.Message, innerMsg);
                throw;
            }
        }

        public async Task SendCompanyPortalWelcomeAsync(string toEmail, string companyName, string portalEnrollmentUrl, string? loginBaseUrl, string? initialPassword = null)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping company portal welcome to {Email}", toEmail);
                return;
            }
            if (string.IsNullOrWhiteSpace(toEmail))
                return;

            var toTrim = toEmail.Trim();
            var loginTrim = (loginBaseUrl ?? "").TrimEnd('/');
            var hasPassword = !string.IsNullOrEmpty(initialPassword);
            var subject = hasPassword
                ? "Welcome — your company portal sign-in & employee enrolment link"
                : "Your company account — employee enrolment link";

            var credentialsPlain = hasPassword
                ? $@"

Your sign-in details
--------------------
Company name:  {companyName}
Email (login): {toTrim}
Password:      {initialPassword}

Keep this message confidential. Do not forward the password. Sign in as soon as you can and change your password if your portal offers that option.

"
                : "";

            var plain = $@"Hello {companyName},

Your company account is ready.{credentialsPlain}Share this link with employees so they can select a course and session. Training fees are billed to your company (no student card payment on this link).

Employee enrolment link:
{portalEnrollmentUrl}
";
            if (!string.IsNullOrWhiteSpace(loginTrim))
                plain += $"\nCompany portal (for you): {loginTrim}\n";

            plain += $@"
If you need help, reply to this email or contact us.

Kind regards,
{_settings.FromName}";

            var encName = System.Net.WebUtility.HtmlEncode(companyName);
            var encTo = System.Net.WebUtility.HtmlEncode(toTrim);
            var encPortalUrl = System.Net.WebUtility.HtmlEncode(portalEnrollmentUrl);
            var encPwd = hasPassword ? System.Net.WebUtility.HtmlEncode(initialPassword!) : "";

            var credentialsHtml = hasPassword
                ? $@"<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin:0 0 24px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;'>
<tr><td style='padding:20px;'>
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Your sign-in details</p>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='font-size:14px;color:#334155;'>
<tr><td style='padding:6px 0;color:#64748b;width:140px;vertical-align:top;'>Company name</td><td style='padding:6px 0;font-weight:600;'>{encName}</td></tr>
<tr><td style='padding:6px 0;color:#64748b;vertical-align:top;'>Email (login)</td><td style='padding:6px 0;font-weight:600;word-break:break-all;'>{encTo}</td></tr>
<tr><td style='padding:6px 0;color:#64748b;vertical-align:top;'>Password</td><td style='padding:6px 0;font-family:Consolas,monospace;font-size:13px;font-weight:600;letter-spacing:0.02em;word-break:break-all;background:#fff;border-radius:4px;border:1px solid #e2e8f0;padding:8px 12px;'>{encPwd}</td></tr>
</table>
<p style='margin:16px 0 0;font-size:13px;color:#64748b;line-height:1.5;'>Keep this email confidential. Do not share your password. Sign in when you can and change your password if your portal allows it.</p>
</td></tr></table>"
                : "";

            var loginBlockHtml = string.IsNullOrWhiteSpace(loginTrim)
                ? ""
                : $@"<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Company portal (for you)</p>
<p style='margin:0 0 24px;font-size:14px;color:#334155;'><a href=""{System.Net.WebUtility.HtmlEncode(loginTrim)}"" style='color:#3b82f6;word-break:break-all;'>{System.Net.WebUtility.HtmlEncode(loginTrim)}</a></p>";

            var html = $@"<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Company portal</title></head>
<body style='margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333;background-color:#f4f4f4;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color:#f4f4f4;padding:20px 0;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
<tr><td style='background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;padding:24px 30px;text-align:center;'>
<h1 style='margin:0;font-size:22px;font-weight:700;'>Your company portal is ready</h1>
</td></tr>
<tr><td style='padding:30px;'>
<p style='margin:0 0 20px;font-size:15px;color:#555;'>Hello <strong style='color:#333;'>{encName}</strong>,</p>
<p style='margin:0 0 20px;font-size:15px;color:#555;'>You can manage your company account and share the employee link below. Training booked through this link is billed to your company.</p>
{credentialsHtml}
<p style='margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;'>Employee enrolment link</p>
<p style='margin:0 0 24px;font-size:14px;color:#334155;'>Share this link with your team so they can choose a course and session:</p>
<p style='margin:0 0 24px;font-size:14px;'><a href=""{encPortalUrl}"" style='color:#3b82f6;word-break:break-all;'>{encPortalUrl}</a></p>
{loginBlockHtml}
<p style='margin:0;font-size:14px;color:#64748b;'>Questions? Reply to this email or contact the training team.</p>
</td></tr>
<tr><td style='padding:20px 30px;background-color:#f8fafc;border-top:1px solid #e2e8f0;'>
<p style='margin:0;font-size:13px;color:#64748b;'>Kind regards,<br/><strong style='color:#334155;'>{System.Net.WebUtility.HtmlEncode(_settings.FromName)}</strong></p>
</td></tr>
</table></td></tr></table></body></html>";

            try
            {
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

                using var client = new SmtpClient();
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                await client.AuthenticateAsync(user, smtpPassword);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_settings.FromName, user));
                message.To.Add(MailboxAddress.Parse(toTrim));
                message.Subject = subject;
                message.Body = new BodyBuilder { TextBody = plain, HtmlBody = html }.ToMessageBody();
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("Company portal welcome email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send company portal welcome to {Email}", toEmail);
            }
        }

        public async Task SendCompanyBillingBankTransferSubmittedAsync(
            string companyEmail,
            string companyName,
            decimal amount,
            string submissionId,
            string linesSummary)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping company billing bank notice");
                return;
            }

            var amountStr = amount.ToString("C", CultureInfo.GetCultureInfo("en-AU"));
            var subjectCompany = $"We received your bank transfer notice — {amountStr}";
            var plainCompany = $@"Hello {companyName},

Thank you. We received your bank transfer payment notice for {amountStr}.

Reference: {submissionId}

Lines included:
{linesSummary}

Our accounts team will verify your transfer against our bank deposit and update your balance. If you have questions, reply to this email or call 1300 976 097.

Safety Training Academy
";
            var htmlCompany = $@"<!DOCTYPE html><html><body style=""font-family:Arial,sans-serif;font-size:14px;color:#333;"">
<p>Hello <strong>{System.Net.WebUtility.HtmlEncode(companyName)}</strong>,</p>
<p>We received your <strong>bank transfer</strong> payment notice for <strong>{System.Net.WebUtility.HtmlEncode(amountStr)}</strong>.</p>
<p>Reference: <code>{System.Net.WebUtility.HtmlEncode(submissionId)}</code></p>
<pre style=""white-space:pre-wrap;font-size:13px;background:#f8fafc;padding:12px;border-radius:8px;"">{System.Net.WebUtility.HtmlEncode(linesSummary)}</pre>
<p>Our team will verify the deposit and update your company balance.</p>
</body></html>";

            var subjectAcademy = $"Company bank transfer notice — {companyName} — {amountStr}";
            var plainAcademy = $@"COMPANY BILLING — BANK TRANSFER SUBMITTED

Company: {companyName} ({companyEmail})
Amount: {amountStr}
Submission ID: {submissionId}

{linesSummary}
";

            try
            {
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

                using var client = new SmtpClient();
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                await client.AuthenticateAsync(user, smtpPassword);

                if (!string.IsNullOrWhiteSpace(companyEmail))
                {
                    var msgC = new MimeMessage();
                    msgC.From.Add(new MailboxAddress(_settings.FromName, user));
                    msgC.To.Add(MailboxAddress.Parse(companyEmail.Trim()));
                    msgC.Subject = subjectCompany;
                    msgC.Body = new BodyBuilder { TextBody = plainCompany, HtmlBody = htmlCompany }.ToMessageBody();
                    await client.SendAsync(msgC);
                }

                var bookings = _settings.BookingsEmail?.Trim();
                if (!string.IsNullOrWhiteSpace(bookings))
                {
                    var msgA = new MimeMessage();
                    msgA.From.Add(new MailboxAddress(_settings.FromName, user));
                    msgA.To.Add(MailboxAddress.Parse(bookings));
                    msgA.Subject = subjectAcademy;
                    msgA.Body = new BodyBuilder { TextBody = plainAcademy }.ToMessageBody();
                    await client.SendAsync(msgA);
                }

                await client.DisconnectAsync(true);
                _logger.LogInformation("Company billing bank submission emails sent for {SubmissionId}", submissionId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send company billing bank submission emails");
            }
        }

        public async Task SendCompanyBillingCardPaymentAppliedAsync(
            string companyEmail,
            string companyName,
            decimal amount,
            string transactionReference,
            string linesSummary)
        {
            if (!_settings.IsConfigured)
            {
                _logger.LogWarning("Email not configured - skipping company billing card notice");
                return;
            }

            var amountStr = amount.ToString("C", CultureInfo.GetCultureInfo("en-AU"));
            var subjectCompany = $"Payment received — {amountStr}";
            var plainCompany = $@"Hello {companyName},

Your card payment of {amountStr} has been applied to your company billing.

Transaction: {transactionReference}

{linesSummary}

Thank you,
Safety Training Academy
";
            var htmlCompany = $@"<!DOCTYPE html><html><body style=""font-family:Arial,sans-serif;font-size:14px;color:#333;"">
<p>Hello <strong>{System.Net.WebUtility.HtmlEncode(companyName)}</strong>,</p>
<p>Your <strong>card payment</strong> of <strong>{System.Net.WebUtility.HtmlEncode(amountStr)}</strong> has been applied to your company account.</p>
<p>Transaction: <code>{System.Net.WebUtility.HtmlEncode(transactionReference)}</code></p>
<pre style=""white-space:pre-wrap;font-size:13px;background:#f8fafc;padding:12px;border-radius:8px;"">{System.Net.WebUtility.HtmlEncode(linesSummary)}</pre>
</body></html>";

            var subjectAcademy = $"Company card payment — {companyName} — {amountStr}";
            var plainAcademy = $@"COMPANY BILLING — CARD PAYMENT APPLIED

Company: {companyName} ({companyEmail})
Amount: {amountStr}
Transaction: {transactionReference}

{linesSummary}
";

            try
            {
                var user = _settings.User?.Trim() ?? string.Empty;
                var smtpPassword = (_settings.Password ?? string.Empty).Replace(" ", "").Trim();
                var socketOptions = _settings.SmtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.Auto;

                using var client = new SmtpClient();
                await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, socketOptions);
                await client.AuthenticateAsync(user, smtpPassword);

                if (!string.IsNullOrWhiteSpace(companyEmail))
                {
                    var msgC = new MimeMessage();
                    msgC.From.Add(new MailboxAddress(_settings.FromName, user));
                    msgC.To.Add(MailboxAddress.Parse(companyEmail.Trim()));
                    msgC.Subject = subjectCompany;
                    msgC.Body = new BodyBuilder { TextBody = plainCompany, HtmlBody = htmlCompany }.ToMessageBody();
                    await client.SendAsync(msgC);
                }

                var bookings = _settings.BookingsEmail?.Trim();
                if (!string.IsNullOrWhiteSpace(bookings))
                {
                    var msgA = new MimeMessage();
                    msgA.From.Add(new MailboxAddress(_settings.FromName, user));
                    msgA.To.Add(MailboxAddress.Parse(bookings));
                    msgA.Subject = subjectAcademy;
                    msgA.Body = new BodyBuilder { TextBody = plainAcademy }.ToMessageBody();
                    await client.SendAsync(msgA);
                }

                await client.DisconnectAsync(true);
                _logger.LogInformation("Company billing card payment emails sent for txn {Ref}", transactionReference);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send company billing card payment emails");
            }
        }

        private static string FormatBookingIdForEmail(string bookingId)
        {
            if (string.IsNullOrWhiteSpace(bookingId)) return "00000000";
            
            // If it's already an 8-digit numeric string, return it as-is
            if (bookingId.Length == 8 && bookingId.All(char.IsDigit)) return bookingId;
            
            // Attempt to convert Guid to a consistent 8-digit decimal number
            if (Guid.TryParse(bookingId, out var guid))
            {
                var bytes = guid.ToByteArray();
                var num = BitConverter.ToUInt32(bytes, 0) % 100000000;
                return num.ToString("D8");
            }

            // Attempt to extract digits only and use that
            var numericPart = new string(bookingId.Where(char.IsDigit).ToArray());
            if (numericPart.Length >= 8) return numericPart[..8];
            if (numericPart.Length > 0) return numericPart.PadLeft(8, '0');
            
            // Fallback: 8 characters uppercase
            if (bookingId.Length >= 8) return bookingId[..8].ToUpperInvariant();
            return bookingId.PadLeft(8, '0').ToUpperInvariant();
        }
    }
}
