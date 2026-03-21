using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Services.CompanyBilling
{
    public interface ICompanyBillingService
    {
        /// <summary>
        /// Marks the enrollment completed and creates a per-course company bill (portal links only), if not already billed.
        /// </summary>
        Task<bool> RecordPortalEnrollmentTrainingCompletedAsync(Guid enrollmentId);

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
