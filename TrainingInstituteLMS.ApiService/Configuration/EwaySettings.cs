namespace TrainingInstituteLMS.ApiService.Configuration
{
    /// <summary>
    /// Configuration settings for eWay payment gateway
    /// </summary>
    public class EwaySettings
    {
        public const string SectionName = "Eway";

        /// <summary>
        /// eWay API Key
        /// </summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// eWay API Password
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Endpoint: "SANDBOX" or "PRODUCTION"
        /// </summary>
        public string Endpoint { get; set; } = "SANDBOX";

        /// <summary>
        /// Get the actual API endpoint URL based on the Endpoint setting
        /// </summary>
        public string GetEndpointUrl()
        {
            return Endpoint?.Equals("PRODUCTION", StringComparison.OrdinalIgnoreCase) == true
                ? "https://api.ewaypayments.com"
                : "https://api.sandbox.ewaypayments.com";
        }
    }
}
