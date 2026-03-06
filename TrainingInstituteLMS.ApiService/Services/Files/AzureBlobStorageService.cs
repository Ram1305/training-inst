using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using TrainingInstituteLMS.ApiService.Configuration;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Files;

namespace TrainingInstituteLMS.ApiService.Services.Files
{
    public class AzureBlobStorageService : IFileStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly FileStorageSettings _settings;
        private readonly ILogger<AzureBlobStorageService> _logger;

        public AzureBlobStorageService(
            IOptions<FileStorageSettings> settings,
            ILogger<AzureBlobStorageService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
            _blobServiceClient = new BlobServiceClient(_settings.AzureConnectionString);
        }

        public async Task<FileUploadResultDto> UploadFileAsync(
            IFormFile file,
            string subFolder,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (!ValidateFile(file, out var errorMessage))
                {
                    return new FileUploadResultDto { Success = false, ErrorMessage = errorMessage };
                }

                // Parse the folder path - first segment is container, rest is virtual folder prefix
                var pathSegments = subFolder.Split('/', StringSplitOptions.RemoveEmptyEntries);
                var containerName = pathSegments[0].ToLowerInvariant(); // Azure container names must be lowercase
                var virtualFolderPrefix = pathSegments.Length > 1 
                    ? string.Join("/", pathSegments.Skip(1)) + "/" 
                    : "";

                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                
                // Blob name includes virtual folder prefix + unique filename
                var blobName = $"{virtualFolderPrefix}{uniqueFileName}";
                var blobClient = containerClient.GetBlobClient(blobName);

                await using var stream = file.OpenReadStream();
                await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType }, cancellationToken: cancellationToken);

                // Store the full relative path for later retrieval
                var relativePath = $"{containerName}/{blobName}";
                _logger.LogInformation("File uploaded to Azure: Container={Container}, Blob={BlobName}", containerName, blobName);

                return new FileUploadResultDto
                {
                    Success = true,
                    RelativePath = relativePath,
                    FileName = uniqueFileName,
                    OriginalFileName = file.FileName,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading to Azure Blob: {Message}", ex.Message);
                return new FileUploadResultDto { Success = false, ErrorMessage = "Upload failed" };
            }
        }

        public async Task<FileDownloadResultDto?> GetFileAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            try
            {
                var parts = relativePath.Split('/', 2); // Split into container and blob path
                if (parts.Length < 2) return null;

                var containerName = parts[0].ToLowerInvariant();
                var blobName = parts[1];

                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                if (!await blobClient.ExistsAsync(cancellationToken)) return null;

                var response = await blobClient.DownloadAsync(cancellationToken);
                using var ms = new MemoryStream();
                await response.Value.Content.CopyToAsync(ms, cancellationToken);

                return new FileDownloadResultDto
                {
                    FileContents = ms.ToArray(),
                    ContentType = response.Value.ContentType,
                    FileName = Path.GetFileName(blobName),
                    FileSize = response.Value.ContentLength
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading from Azure Blob");
                return null;
            }
        }

        public async Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            try
            {
                var parts = relativePath.Split('/', 2);
                if (parts.Length < 2)
                {
                    _logger.LogWarning("❌ Azure Delete - Invalid path format: {Path}", relativePath);
                    return false;
                }

                var containerName = parts[0].ToLowerInvariant();
                var blobName = parts[1];

                _logger.LogWarning(
                    "🗑️  AZURE DELETE - Container: {Container}, Blob: {Blob}, FullPath: {Path}", 
                    containerName, blobName, relativePath);

                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(blobName);
                
                var deleted = await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
                
                if (deleted)
                {
                    _logger.LogWarning("✅ AZURE DELETE SUCCESS: {Path}", relativePath);
                }
                else
                {
                    _logger.LogWarning("⚠️  AZURE DELETE - Blob not found: {Path}", relativePath);
                }
                
                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 AZURE DELETE ERROR: {Path} - {Error}", relativePath, ex.Message);
                return false;
            }
        }

        public bool ValidateFile(IFormFile file, out string errorMessage)
        {
            errorMessage = string.Empty;
            if (file == null || file.Length == 0) { errorMessage = "No file provided."; return false; }
            if (file.Length > _settings.MaxFileSizeBytes) { errorMessage = "File too large."; return false; }
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_settings.AllowedExtensions.Contains(ext)) { errorMessage = $"Type '{ext}' not allowed."; return false; }
            return true;
        }

        public bool IsFolderAllowed(string folderName)
        {
            // For Azure, we check if the base container (first segment) is in the allowed list
            var containerName = folderName.Split('/')[0].ToLowerInvariant();
            return _settings.AllowedFolders.Any(f => 
                f.ToLowerInvariant() == containerName || 
                f.ToLowerInvariant().StartsWith(containerName + "/") ||
                f.ToLowerInvariant() == folderName.ToLowerInvariant());
        }

        public string GetFileUrl(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return relativePath;

            // When BaseUrl is configured, use API proxy URLs (same as FileStorageService)
            // so course/gallery images are served consistently via FilesController.
            if (!string.IsNullOrEmpty(_settings.BaseUrl))
            {
                var normalizedPath = relativePath.Replace("\\", "/");
                // Strip duplicate "api/files/" prefix if present (fixes existing bad stored paths)
                const string apiFilesPrefix = "api/files/";
                if (normalizedPath.StartsWith(apiFilesPrefix, StringComparison.OrdinalIgnoreCase))
                    normalizedPath = normalizedPath.Substring(apiFilesPrefix.Length);
                return $"{_settings.BaseUrl.TrimEnd('/')}/{normalizedPath}";
            }

            // Fallback to direct blob URL when BaseUrl is not set
            var parts = relativePath.Split('/', 2);
            if (parts.Length < 2) return relativePath;

            var containerName = parts[0].ToLowerInvariant();
            var blobName = parts[1];

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);
            return blobClient.Uri.ToString();
        }
    }
}
