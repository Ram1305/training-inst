namespace TrainingInstituteLMS.ApiService.Services.SiteSettings
{
    public interface ISiteSettingsService
    {
        /// <summary>
        /// Gets the enrollment base URL from the SiteSettings collection, then config, then default.
        /// Result is cached for a short period.
        /// </summary>
        Task<string> GetEnrollmentBaseUrlAsync();

        /// <summary>
        /// GA4 measurement id (G-XXXX): SiteSettings key GtagMeasurementId, then configuration Analytics:GtagMeasurementId.
        /// Null or empty if not configured.
        /// </summary>
        Task<string?> GetGtagMeasurementIdAsync();

        /// <summary>
        /// Gets AllowPayLater for an enrollment link from SiteSettings key-value store.
        /// </summary>
        Task<bool> GetEnrollmentLinkAllowPayLaterAsync(Guid linkId);

        /// <summary>
        /// Gets AllowPayLater for multiple enrollment links in one query.
        /// </summary>
        Task<Dictionary<Guid, bool>> GetEnrollmentLinkAllowPayLaterBatchAsync(IEnumerable<Guid> linkIds);

        /// <summary>
        /// Sets AllowPayLater for an enrollment link in SiteSettings.
        /// </summary>
        Task SetEnrollmentLinkAllowPayLaterAsync(Guid linkId, bool allowPayLater);

        /// <summary>
        /// When true, the public enroll wizard hides prices in the course dropdown (agent / quote-style links).
        /// </summary>
        Task<bool> GetEnrollmentLinkIsAgentLinkAsync(Guid linkId);

        Task<Dictionary<Guid, bool>> GetEnrollmentLinkIsAgentLinkBatchAsync(IEnumerable<Guid> linkIds);

        Task SetEnrollmentLinkIsAgentLinkAsync(Guid linkId, bool isAgentLink);
    }
}
