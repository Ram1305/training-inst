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

            string? value = null;
            try
            {
                value = await GetEnrollmentBaseUrlFromDbAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load EnrollmentBaseUrl from database. Falling back to configuration.");
            }

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

            value = DefaultEnrollmentBaseUrl;
            _logger.LogInformation("Using default enrollment base URL: {Url}", value);
            return value;
        }

        private async Task<string?> GetEnrollmentBaseUrlFromDbAsync()
        {
            var setting = await _context.SiteSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == "EnrollmentBaseUrl");
            return setting?.Value;
        }

        public async Task<string?> GetGtagMeasurementIdAsync()
        {
            try
            {
                var setting = await _context.SiteSettings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Key == "GtagMeasurementId");
                var fromDb = setting?.Value?.Trim();
                if (!string.IsNullOrEmpty(fromDb))
                    return fromDb;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load GtagMeasurementId from database.");
            }

            var fromConfig = _configuration["Analytics:GtagMeasurementId"]?.Trim();
            return string.IsNullOrEmpty(fromConfig) ? null : fromConfig;
        }

        private const string AllowPayLaterPrefix = "EnrollmentLink_AllowPayLater_";
        private static string AllowPayLaterKey(Guid linkId) => $"{AllowPayLaterPrefix}{linkId:N}";

        public async Task<bool> GetEnrollmentLinkAllowPayLaterAsync(Guid linkId)
        {
            var key = AllowPayLaterKey(linkId);
            var setting = await _context.SiteSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == key);
            return string.Equals(setting?.Value, "true", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<Dictionary<Guid, bool>> GetEnrollmentLinkAllowPayLaterBatchAsync(IEnumerable<Guid> linkIds)
        {
            var ids = linkIds.ToList();
            if (ids.Count == 0) return new Dictionary<Guid, bool>();
            var keys = ids.Select(id => AllowPayLaterKey(id)).ToList();
            var settings = await _context.SiteSettings
                .AsNoTracking()
                .Where(s => keys.Contains(s.Key))
                .ToListAsync();
            var dict = ids.ToDictionary(id => id, _ => false);
            foreach (var s in settings)
            {
                if (s.Key.StartsWith(AllowPayLaterPrefix, StringComparison.Ordinal) &&
                    Guid.TryParse(s.Key.AsSpan(AllowPayLaterPrefix.Length), out var linkId) &&
                    dict.ContainsKey(linkId))
                    dict[linkId] = string.Equals(s.Value, "true", StringComparison.OrdinalIgnoreCase);
            }
            return dict;
        }

        public async Task SetEnrollmentLinkAllowPayLaterAsync(Guid linkId, bool allowPayLater)
        {
            var key = AllowPayLaterKey(linkId);
            var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);
            var value = allowPayLater ? "true" : "false";
            if (setting != null)
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                await _context.SiteSettings.AddAsync(new SiteSetting
                {
                    Id = Guid.NewGuid(),
                    Key = key,
                    Value = value
                });
            }
            await _context.SaveChangesAsync();
        }

        private const string IsAgentLinkPrefix = "EnrollmentLink_IsAgentLink_";
        private static string IsAgentLinkKey(Guid linkId) => $"{IsAgentLinkPrefix}{linkId:N}";

        public async Task<bool> GetEnrollmentLinkIsAgentLinkAsync(Guid linkId)
        {
            var key = IsAgentLinkKey(linkId);
            var setting = await _context.SiteSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == key);
            return string.Equals(setting?.Value, "true", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<Dictionary<Guid, bool>> GetEnrollmentLinkIsAgentLinkBatchAsync(IEnumerable<Guid> linkIds)
        {
            var ids = linkIds.ToList();
            if (ids.Count == 0) return new Dictionary<Guid, bool>();
            var keys = ids.Select(id => IsAgentLinkKey(id)).ToList();
            var settings = await _context.SiteSettings
                .AsNoTracking()
                .Where(s => keys.Contains(s.Key))
                .ToListAsync();
            var dict = ids.ToDictionary(id => id, _ => false);
            foreach (var s in settings)
            {
                if (s.Key.StartsWith(IsAgentLinkPrefix, StringComparison.Ordinal) &&
                    Guid.TryParse(s.Key.AsSpan(IsAgentLinkPrefix.Length), out var linkId) &&
                    dict.ContainsKey(linkId))
                    dict[linkId] = string.Equals(s.Value, "true", StringComparison.OrdinalIgnoreCase);
            }
            return dict;
        }

        public async Task SetEnrollmentLinkIsAgentLinkAsync(Guid linkId, bool isAgentLink)
        {
            var key = IsAgentLinkKey(linkId);
            var setting = await _context.SiteSettings.FirstOrDefaultAsync(s => s.Key == key);
            var value = isAgentLink ? "true" : "false";
            if (setting != null)
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                await _context.SiteSettings.AddAsync(new SiteSetting
                {
                    Id = Guid.NewGuid(),
                    Key = key,
                    Value = value
                });
            }
            await _context.SaveChangesAsync();
        }
    }
}
