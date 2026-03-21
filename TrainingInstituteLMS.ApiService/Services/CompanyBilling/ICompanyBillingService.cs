using System.Threading;
using Microsoft.AspNetCore.Http;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CompanyBilling;

namespace TrainingInstituteLMS.ApiService.Services.CompanyBilling
{
    public interface ICompanyBillingService
    {
        /// <summary>
        /// Marks training complete. Creates a company bill when the company still owes fees and no billing line exists; otherwise only updates completion.
        /// </summary>
        Task<bool> RecordPortalEnrollmentTrainingCompletedAsync(Guid enrollmentId);

        /// <summary>
        /// Creates an unpaid company billing statement for this enrollment when the company still owes fees and no line exists yet (portal or pay-later bulk links).
        /// </summary>
        Task<bool> EnsureUnpaidCompanyBillForEnrollmentAsync(Guid enrollmentId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Ensures billing lines exist for unpaid company enrolments that were created before pay-at-company billing was enabled.
        /// </summary>
        Task BackfillUnpaidCompanyBillsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);

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
        /// Converts legacy Draft/Approved rows with an open balance to Unpaid so the company can pay without an admin approval step.
        /// </summary>
        Task NormalizeLegacyBillingStatusesForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Applies a payment that must equal the combined balance due on the selected statements (full settlement only). Updates PaidAmount / status.
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
