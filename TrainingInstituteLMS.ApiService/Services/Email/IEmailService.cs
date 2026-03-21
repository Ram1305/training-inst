namespace TrainingInstituteLMS.ApiService.Services.Email
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends a company order confirmation email with purchased course details and one-time enrollment links.
        /// Optionally includes login info when a company account was created.
        /// </summary>
        Task SendCompanyOrderConfirmationAsync(
            string toEmail,
            string companyName,
            string orderId,
            decimal totalAmount,
            List<(string CourseName, string FullUrl, string CourseDateDisplay)> links,
            bool accountCreated,
            string? loginBaseUrl);

        /// <summary>
        /// Sends a confirmation email to the student when they complete registration via an enrollment link.
        /// Includes course details and login URL (they use the password they just set).
        /// </summary>
        Task SendEnrollmentLinkRegistrationConfirmationAsync(
            string toEmail,
            string studentName,
            string courseName,
            string? courseCode,
            DateTime? scheduledDate,
            TimeSpan? startTime,
            TimeSpan? endTime,
            string? location,
            string loginBaseUrl);

        /// <summary>
        /// Sends an enrollment confirmation email to the student after successful payment.
        /// Includes login credentials for the student portal.
        /// </summary>
        Task SendEnrollmentConfirmationAsync(
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
            string password);
        Task SendVOCSubmissionConfirmationAsync(
            string toEmail,
            string firstName,
            string lastName,
            string submissionId,
            decimal amountPaid,
            string paymentMethod,
            string selectedCoursesJson);

        Task SendEmailOTPAsync(string toEmail, string otp);

        /// <summary>
        /// Welcome email for a new company account with the permanent employee enrolment link.
        /// </summary>
        Task SendCompanyPortalWelcomeAsync(string toEmail, string companyName, string portalEnrollmentUrl, string? loginBaseUrl);
    }
}
