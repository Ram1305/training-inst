using TrainingInstituteLMS.DTOs.DTOs.Requests.Company;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Company;

namespace TrainingInstituteLMS.ApiService.Services.CompanyManagement
{
    public interface ICompanyManagementService
    {
        Task<CompanyListResponseDto> GetAllCompaniesAsync(CompanyFilterRequestDto filter);
        Task<CompanyResponseDto?> GetCompanyByIdAsync(Guid companyId);
        Task<CompanyResponseDto?> GetCompanyByUserIdAsync(Guid userId);
        Task<CompanyResponseDto?> CreateCompanyAsync(CreateCompanyRequestDto request, Guid? createdBy = null);
        Task<CompanyResponseDto?> UpdateCompanyAsync(Guid companyId, UpdateCompanyRequestDto request);
        Task<bool> DeleteCompanyAsync(Guid companyId);
        Task<bool> ToggleCompanyStatusAsync(Guid companyId);

        Task<CompanyPortalEnrollmentsResponseDto> GetCompanyPortalEnrollmentsAsync(Guid companyId);
    }
}
