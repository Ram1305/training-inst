using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.CompanyBilling;
using TrainingInstituteLMS.ApiService.Services.CompanyManagement;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Company;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Company;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Controllers.Company
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyManagementController : ControllerBase
    {
        private readonly ICompanyManagementService _companyManagementService;
        private readonly ICompanyBillingService _companyBillingService;
        private readonly ILogger<CompanyManagementController> _logger;

        public CompanyManagementController(
            ICompanyManagementService companyManagementService,
            ICompanyBillingService companyBillingService,
            ILogger<CompanyManagementController> logger)
        {
            _companyManagementService = companyManagementService;
            _companyBillingService = companyBillingService;
            _logger = logger;
        }

        private Guid? GetCurrentUserId()
        {
            var v = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(v, out var id) ? id : null;
        }

        private static bool IsPrivilegedAdmin(ClaimsPrincipal user) =>
            user.IsInRole("Admin") || user.IsInRole("SuperAdmin");

        /// <summary>
        /// Company portal: submit bank transfer notice for selected bills (receipt required). Emails company and academy.
        /// </summary>
        [HttpPost("{companyId:guid}/billing/bank-transfer")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>>> SubmitCompanyBillingBankTransfer(
            Guid companyId,
            [FromForm] string statementIds,
            [FromForm] decimal amount,
            [FromForm] string? customerReference,
            IFormFile receipt,
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("Authentication required."));

            try
            {
                var company = await _companyManagementService.GetCompanyByIdAsync(companyId);
                if (company == null || company.UserId != userId.Value)
                    return Forbid();

                List<Guid> ids;
                try
                {
                    ids = JsonSerializer.Deserialize<List<Guid>>(statementIds ?? "[]") ?? new List<Guid>();
                }
                catch
                {
                    return BadRequest(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("Invalid statementIds JSON."));
                }

                if (receipt == null || receipt.Length == 0)
                    return BadRequest(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("Receipt file is required."));

                if (string.IsNullOrWhiteSpace(customerReference))
                    return BadRequest(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("Transaction or bank reference is required."));

                var result = await _companyBillingService.SubmitCompanyBankTransferAsync(
                    companyId,
                    ids,
                    amount,
                    customerReference,
                    receipt,
                    cancellationToken);

                if (result == null)
                    return BadRequest(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("Could not submit payment notice."));

                return Ok(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.SuccessResponse(result, result.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bank transfer submission failed for company {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<CompanyBillingBankTransferSubmissionResponseDto>.FailureResponse("An error occurred."));
            }
        }

        /// <summary>
        /// Students and courses enrolled under this company (portal link and company-order links).
        /// </summary>
        [HttpGet("{companyId:guid}/portal-enrollments")]
        [ProducesResponseType(typeof(ApiResponse<CompanyPortalEnrollmentsResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CompanyPortalEnrollmentsResponseDto>>> GetCompanyPortalEnrollments(Guid companyId)
        {
            try
            {
                var result = await _companyManagementService.GetCompanyPortalEnrollmentsAsync(companyId);
                return Ok(ApiResponse<CompanyPortalEnrollmentsResponseDto>.SuccessResponse(result, "OK"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving portal enrollments for company {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<CompanyPortalEnrollmentsResponseDto>.FailureResponse("An error occurred"));
            }
        }

        /// <summary>
        /// Billing statements for a company (per-course or legacy daily batches).
        /// </summary>
        [HttpGet("{companyId:guid}/billing-statements")]
        [ProducesResponseType(typeof(ApiResponse<CompanyBillingStatementListResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CompanyBillingStatementListResponseDto>>> GetCompanyBillingStatements(
            Guid companyId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _companyBillingService.GetStatementsForCompanyAsync(companyId, page, pageSize);
                return Ok(ApiResponse<CompanyBillingStatementListResponseDto>.SuccessResponse(result, "OK"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving billing statements for company {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<CompanyBillingStatementListResponseDto>.FailureResponse("An error occurred"));
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CompanyListResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<CompanyListResponseDto>>> GetAllCompanies([FromQuery] CompanyFilterRequestDto filter)
        {
            try
            {
                var result = await _companyManagementService.GetAllCompaniesAsync(filter);
                return Ok(ApiResponse<CompanyListResponseDto>.SuccessResponse(result, "Companies retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving companies");
                return StatusCode(500, ApiResponse<CompanyListResponseDto>.FailureResponse("An error occurred while retrieving companies"));
            }
        }

        [HttpGet("{companyId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<CompanyResponseDto>>> GetCompanyById(Guid companyId)
        {
            try
            {
                var company = await _companyManagementService.GetCompanyByIdAsync(companyId);

                if (company == null)
                {
                    return NotFound(ApiResponse<CompanyResponseDto>.FailureResponse("Company not found"));
                }

                return Ok(ApiResponse<CompanyResponseDto>.SuccessResponse(company, "Company retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving company: {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<CompanyResponseDto>.FailureResponse("An error occurred while retrieving company"));
            }
        }

        [HttpGet("user/{userId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<CompanyResponseDto>>> GetCompanyByUserId(Guid userId)
        {
            try
            {
                var company = await _companyManagementService.GetCompanyByUserIdAsync(userId);

                if (company == null)
                {
                    return NotFound(ApiResponse<CompanyResponseDto>.FailureResponse("Company not found"));
                }

                return Ok(ApiResponse<CompanyResponseDto>.SuccessResponse(company, "Company retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving company by user ID: {UserId}", userId);
                return StatusCode(500, ApiResponse<CompanyResponseDto>.FailureResponse("An error occurred while retrieving company"));
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<CompanyResponseDto>>> CreateCompany([FromBody] CreateCompanyRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ErrorResponse
                {
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            try
            {
                var result = await _companyManagementService.CreateCompanyAsync(request, null);

                if (result == null)
                {
                    return BadRequest(ApiResponse<CompanyResponseDto>.FailureResponse("Email already exists"));
                }

                return Ok(ApiResponse<CompanyResponseDto>.SuccessResponse(result, "Company created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating company");
                return StatusCode(500, ApiResponse<CompanyResponseDto>.FailureResponse("An error occurred while creating company"));
            }
        }

        [HttpPut("{companyId:guid}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<ApiResponse<CompanyResponseDto>>> UpdateCompany(
            Guid companyId,
            [FromBody] UpdateCompanyRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ErrorResponse
                {
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
                return Unauthorized(ApiResponse<CompanyResponseDto>.FailureResponse("Authentication required."));

            try
            {
                var existing = await _companyManagementService.GetCompanyByIdAsync(companyId);
                if (existing == null)
                    return NotFound(ApiResponse<CompanyResponseDto>.FailureResponse("Company not found"));

                if (!IsPrivilegedAdmin(User) && existing.UserId != currentUserId.Value)
                    return Forbid();

                var result = await _companyManagementService.UpdateCompanyAsync(companyId, request);

                if (result == null)
                {
                    return NotFound(ApiResponse<CompanyResponseDto>.FailureResponse("Company not found or email already exists"));
                }

                return Ok(ApiResponse<CompanyResponseDto>.SuccessResponse(result, "Company updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating company: {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<CompanyResponseDto>.FailureResponse("An error occurred while updating company"));
            }
        }

        [HttpDelete("{companyId:guid}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCompany(Guid companyId)
        {
            try
            {
                var result = await _companyManagementService.DeleteCompanyAsync(companyId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Company not found"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Company deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting company: {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while deleting company"));
            }
        }

        [HttpPatch("{companyId:guid}/toggle-status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleCompanyStatus(Guid companyId)
        {
            try
            {
                var result = await _companyManagementService.ToggleCompanyStatusAsync(companyId);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.FailureResponse("Company not found"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Company status toggled successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling company status: {CompanyId}", companyId);
                return StatusCode(500, ApiResponse<bool>.FailureResponse("An error occurred while toggling company status"));
            }
        }
    }
}
