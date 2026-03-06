namespace TrainingInstituteLMS.ApiService.Configuration
{
    /// <summary>
    /// Configuration settings for email (SMTP) - used for OTP and notifications
    /// </summary>
    public class EmailSettings
    {
        public const string SectionName = "Email";

        /// <summary>
        /// SMTP username (e.g. Gmail address). Use EMAIL_USER env var.
        /// </summary>
        public string User { get; set; } = string.Empty;

        /// <summary>
        /// SMTP password (e.g. Gmail app password). Use EMAIL_PASS env var.
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// SMTP host (default: smtp.gmail.com for Gmail)
        /// </summary>
        public string SmtpHost { get; set; } = "smtp.gmail.com";

        /// <summary>
        /// SMTP port (default: 587 for StartTLS)
        /// </summary>
        public int SmtpPort { get; set; } = 587;

        /// <summary>
        /// Display name for the "From" field
        /// </summary>
        public string FromName { get; set; } = "Training Institute LMS";

        /// <summary>
        /// Academy bookings email - receives a copy of each enrollment notification.
        /// </summary>
        public string BookingsEmail { get; set; } = "Bookings@safetytrainingacademy.edu.au";

        /// <summary>
        /// Whether email is configured and can be sent
        /// </summary>
        public bool IsConfigured => !string.IsNullOrWhiteSpace(User) && !string.IsNullOrWhiteSpace(Password);
    }
}
