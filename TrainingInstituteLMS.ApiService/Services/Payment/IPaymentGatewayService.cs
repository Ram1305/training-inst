using TrainingInstituteLMS.DTOs.DTOs.Requests.Payment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Payment;

namespace TrainingInstituteLMS.ApiService.Services.Payment
{
    public interface IPaymentGatewayService
    {
        /// <summary>
        /// Process a credit card payment and create enrollment
        /// </summary>
        Task<CardPaymentResultResponseDto> ProcessCardPaymentAsync(ProcessCardPaymentRequestDto request);
    }
}
