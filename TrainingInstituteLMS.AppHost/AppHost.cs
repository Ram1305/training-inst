var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.TrainingInstituteLMS_ApiService>("apiservice")
    .WithHttpHealthCheck("/health");

// React dev server (Vite)
// For npm apps, only specify targetPort and let Aspire handle the proxy port
var webfrontend = builder.AddNpmApp("webfrontend", "../TrainingInstituteLMS.Web", "dev")
    .WithEnvironment("PORT", "5173")
    .WithHttpEndpoint(targetPort: 5173)
    .WithExternalHttpEndpoints()
    .WithReference(apiService)
    .WithEnvironment("VITE_API_BASE_URL", apiService.GetEndpoint("https"));

builder.Build().Run();
