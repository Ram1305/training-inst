namespace TrainingInstituteLMS.ApiService.Services.SiteSettings
{
    public interface ISiteSettingsService
    {
        /// <summary>
        /// Gets the enrollment base URL from the SiteSettings collection, then config, then default.
        /// Result is cached for a short period.
        /// </summary>
        Task<string> GetEnrollmentBaseUrlAsync();
    }
}
