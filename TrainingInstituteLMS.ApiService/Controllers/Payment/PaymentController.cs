using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Payment;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Payment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Payment;

namespace TrainingInstituteLMS.ApiService.Controllers.Payment
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IPaymentGatewayService paymentGatewayService, ILogger<PaymentController> logger)
        {
            _paymentGatewayService = paymentGatewayService;
            _logger = logger;
        }

        /// <summary>
        /// Process a credit card payment and create enrollment
        /// </summary>
        [HttpPost("process-card")]
        public async Task<IActionResult> ProcessCardPayment([FromBody] ProcessCardPaymentRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errorList = ModelState
                    .Where(ms => ms.Value?.Errors.Count > 0)
                    .SelectMany(ms => ms.Value!.Errors.Select(e =>
                        string.IsNullOrEmpty(ms.Key) ? e.ErrorMessage ?? "Invalid value" : $"{ms.Key}: {e.ErrorMessage ?? "Invalid value"}"))
                    .ToList();
                var message = errorList.Count > 0 ? "Validation failed." : "Invalid request data.";
                return BadRequest(ApiResponse<CardPaymentResultResponseDto>.FailureResponse(message, errorList));
            }

            try
            {
                var result = await _paymentGatewayService.ProcessCardPaymentAsync(request);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Card payment successful for {Email} - TransactionId: {TransactionId}",
                        request.Email, result.TransactionId);

                    return Ok(ApiResponse<CardPaymentResultResponseDto>.SuccessResponse(result, "Payment processed successfully"));
                }
                else
                {
                    var exactError = result.ErrorMessages ?? result.ResponseMessage ?? "Payment failed";
                    _logger.LogWarning(
                        "Card payment failed for {Email} - Error: {Error}",
                        request.Email, exactError);

                    return BadRequest(ApiResponse<CardPaymentResultResponseDto>.FailureResponse(
                        exactError,
                        new[] { exactError }));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing card payment for {Email}", request.Email);
                return StatusCode(500, ApiResponse<CardPaymentResultResponseDto>.FailureResponse(
                    $"An error occurred while processing your payment: {ex.Message}"));
            }
        }

        /// <summary>
        /// Health check for payment gateway
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { Status = "Payment Gateway Available", Timestamp = DateTime.UtcNow });
        }
    }
}
