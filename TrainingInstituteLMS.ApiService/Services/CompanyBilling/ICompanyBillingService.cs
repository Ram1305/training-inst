using Microsoft.AspNetCore.Http;
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

        /// <summary>
        /// Allocates a payment across statements in order until the amount is used. Updates PaidAmount / status.
        /// </summary>
        Task<(bool Ok, string? Error)> ApplyCompanyBillingPaymentAsync(
            Guid companyId,
            IReadOnlyList<Guid> statementIdsInOrder,
            decimal paymentAmount,
            string paymentMethod,
            string paymentReference,
            string? gatewayTransactionId);

        Task<CompanyBillingBankTransferSubmissionResponseDto?> SubmitCompanyBankTransferAsync(
            Guid companyId,
            IReadOnlyList<Guid> statementIdsInOrder,
            decimal amount,
            string? customerReference,
            IFormFile receipt,
            CancellationToken cancellationToken = default);

        Task<(bool Ok, string? Error)> ApplyBankSubmissionAsync(Guid submissionId);

        Task<string> FormatBillingPaymentSummaryAsync(IReadOnlyList<Guid> statementIdsInOrder, Guid companyId);
    }
}
