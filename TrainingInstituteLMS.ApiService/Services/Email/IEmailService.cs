namespace TrainingInstituteLMS.ApiService.Services.Email
{
    public interface IEmailService
    {
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
    }
}
