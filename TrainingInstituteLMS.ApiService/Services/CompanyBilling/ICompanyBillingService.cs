using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Services.CompanyBilling
{
    public interface ICompanyBillingService
    {
        Task AddLineForPortalEnrollmentAsync(
            Guid companyId,
            Guid enrollmentId,
            decimal amount,
            string? courseName,
            string? studentName,
            DateTime enrolledAtUtc);

        Task<CompanyBillingStatementListResponseDto> GetAdminStatementsAsync(
            int page,
            int pageSize,
            string? status,
            string? search,
            Guid? companyId);

        Task<CompanyBillingStatementDetailDto?> GetStatementDetailAsync(Guid statementId);

        Task<bool> UpdateStatementAsync(
            Guid statementId,
            string status,
            Guid? approvedByUserId,
            string? paymentMethod,
            string? paymentReference);

        Task<CompanyBillingStatementListResponseDto> GetStatementsForCompanyAsync(Guid companyId, int page, int pageSize);
    }
}
