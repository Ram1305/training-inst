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

        /// <summary>
        /// Billing statements for a company (portal enrolments by Sydney calendar day).
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
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CompanyResponseDto>), StatusCodes.Status404NotFound)]
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

            try
            {
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
