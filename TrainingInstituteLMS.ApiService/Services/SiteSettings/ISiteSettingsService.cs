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
    }
}
