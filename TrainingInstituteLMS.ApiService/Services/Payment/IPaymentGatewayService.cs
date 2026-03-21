using TrainingInstituteLMS.DTOs.DTOs.Requests.Payment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Payment;

namespace TrainingInstituteLMS.ApiService.Services.Payment
{
    public interface IPaymentGatewayService
    {
        /// <summary>
        /// Process a credit card payment and create enrollment (for new users)
        /// </summary>
        Task<CardPaymentResultResponseDto> ProcessCardPaymentAsync(ProcessCardPaymentRequestDto request);

        /// <summary>
        /// Process a credit card payment and create enrollment (for existing logged-in students)
        /// </summary>
        Task<CardPaymentResultResponseDto> ProcessCardPaymentExistingStudentAsync(ProcessCardPaymentExistingStudentRequestDto request);

        Task<CardPaymentResultResponseDto> ProcessCompanyBillingCardPaymentAsync(
            ProcessCompanyBillingCardPaymentRequestDto request,
            Guid authenticatedUserId);
    }
}
