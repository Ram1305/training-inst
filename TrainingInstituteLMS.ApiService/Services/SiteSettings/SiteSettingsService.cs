using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.System;

namespace TrainingInstituteLMS.ApiService.Services.SiteSettings
{
    public class SiteSettingsService : ISiteSettingsService
    {
        private const string CacheKey = "SiteSettings:EnrollmentBaseUrl";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
        private const string DefaultEnrollmentBaseUrl = "https://safetytrainingacademy.edu.au";

        private readonly TrainingLMSDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SiteSettingsService> _logger;

        public SiteSettingsService(
            TrainingLMSDbContext context,
            IMemoryCache cache,
            IConfiguration configuration,
            ILogger<SiteSettingsService> logger)
        {
            _context = context;
            _cache = cache;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GetEnrollmentBaseUrlAsync()
        {
            if (_cache.TryGetValue(CacheKey, out string? cached))
                return cached!;

            var value = await GetEnrollmentBaseUrlFromDbAsync();
            if (!string.IsNullOrWhiteSpace(value))
            {
                value = value.TrimEnd('/');
                _cache.Set(CacheKey, value, CacheDuration);
                _logger.LogDebug("Using EnrollmentBaseUrl from SiteSettings: {Url}", value);
                return value;
            }

            var configuredUrl = _configuration["FrontendUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
            {
                value = configuredUrl.TrimEnd('/');
                _cache.Set(CacheKey, value, CacheDuration);
                _logger.LogInformation("Using FrontendUrl from config: {Url}", value);
                return value;
            }

            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            if (string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
            {
                value = "http://localhost:5173";
                _logger.LogInformation("Using localhost for development");
                return value;
            }

            _logger.LogInformation("Using default enrollment base URL: {Url}", DefaultEnrollmentBaseUrl);
            return DefaultEnrollmentBaseUrl;
        }

        private async Task<string?> GetEnrollmentBaseUrlFromDbAsync()
        {
            var setting = await _context.SiteSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "EnrollmentBaseUrl");
            return setting?.Value;
        }
    }
}
