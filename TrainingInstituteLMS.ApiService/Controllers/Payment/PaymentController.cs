using System.Security.Claims;
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

        private Guid? GetCurrentUserId()
        {
            var v = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(v, out var id) ? id : null;
        }

        /// <summary>
        /// Company portal: pay selected billing statements by card (eWay). User must own the company.
        /// </summary>
        [HttpPost("process-card-company-billing")]
        public async Task<IActionResult> ProcessCompanyBillingCardPayment([FromBody] ProcessCompanyBillingCardPaymentRequestDto request)
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

            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(ApiResponse<CardPaymentResultResponseDto>.FailureResponse("Authentication required."));

            try
            {
                var result = await _paymentGatewayService.ProcessCompanyBillingCardPaymentAsync(request, userId.Value);
                if (result.Success)
                    return Ok(ApiResponse<CardPaymentResultResponseDto>.SuccessResponse(result, "Payment processed successfully"));

                var exactError = result.ErrorMessages ?? result.ResponseMessage ?? "Payment failed";
                return BadRequest(ApiResponse<CardPaymentResultResponseDto>.FailureResponse(exactError, new[] { exactError }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Company billing card payment error");
                return StatusCode(500, ApiResponse<CardPaymentResultResponseDto>.FailureResponse(ex.Message));
            }
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
        /// Process a credit card payment for an existing logged-in student and create enrollment
        /// </summary>
        [HttpPost("process-card-existing-student")]
        public async Task<IActionResult> ProcessCardPaymentExistingStudent([FromBody] ProcessCardPaymentExistingStudentRequestDto request)
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
                var result = await _paymentGatewayService.ProcessCardPaymentExistingStudentAsync(request);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Card payment successful for existing student {StudentId} - TransactionId: {TransactionId}",
                        request.StudentId, result.TransactionId);

                    return Ok(ApiResponse<CardPaymentResultResponseDto>.SuccessResponse(result, "Payment processed successfully"));
                }
                else
                {
                    var exactError = result.ErrorMessages ?? result.ResponseMessage ?? "Payment failed";
                    _logger.LogWarning(
                        "Card payment failed for existing student {StudentId} - Error: {Error}",
                        request.StudentId, exactError);

                    return BadRequest(ApiResponse<CardPaymentResultResponseDto>.FailureResponse(
                        exactError,
                        new[] { exactError }));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing card payment for existing student {StudentId}", request.StudentId);
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
