using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TrainingInstituteLMS.ApiService.Configuration;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Files;

namespace TrainingInstituteLMS.ApiService.Services.Files
{
    public class FileStorageService : IFileStorageService
    {
        private readonly FileStorageSettings _settings;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(
            IOptions<FileStorageSettings> settings,
            ILogger<FileStorageService> logger)
        {
            _settings = settings.Value;
            _logger = logger;

            EnsureBaseDirectoryExists();
        }

        public async Task<FileUploadResultDto> UploadFileAsync(
            IFormFile file,
            string subFolder,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Validate folder
                if (!IsFolderAllowed(subFolder))
                {
                    return new FileUploadResultDto
                    {
                        Success = false,
                        ErrorMessage = $"Folder '{subFolder}' is not allowed."
                    };
                }

                // Validate file
                if (!ValidateFile(file, out var errorMessage))
                {
                    return new FileUploadResultDto
                    {
                        Success = false,
                        ErrorMessage = errorMessage
                    };
                }

                // Generate unique filename to prevent overwrites and conflicts
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

                // Create subfolder path
                var folderPath = Path.Combine(_settings.BasePath, subFolder);
                Directory.CreateDirectory(folderPath);

                // Full file path
                var filePath = Path.Combine(folderPath, uniqueFileName);

                // Save file
                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream, cancellationToken);

                // Return relative path for database storage (use forward slashes for consistency)
                var relativePath = Path.Combine(subFolder, uniqueFileName).Replace("\\", "/");

                _logger.LogInformation(
                    "File uploaded successfully: {RelativePath}, Size: {Size} bytes",
                    relativePath,
                    file.Length);

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
                _logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
                return new FileUploadResultDto
                {
                    Success = false,
                    ErrorMessage = "An error occurred while uploading the file."
                };
            }
        }

        public async Task<FileDownloadResultDto?> GetFileAsync(
            string relativePath,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Normalize path separators
                relativePath = relativePath.Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(_settings.BasePath, relativePath);

                // Security check - prevent directory traversal attacks
                var resolvedPath = Path.GetFullPath(fullPath);
                var resolvedBasePath = Path.GetFullPath(_settings.BasePath);

                if (!resolvedPath.StartsWith(resolvedBasePath, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "Directory traversal attempt detected: {Path}",
                        relativePath);
                    return null;
                }

                if (!File.Exists(fullPath))
                {
                    _logger.LogWarning("File not found: {Path}", relativePath);
                    return null;
                }

                var fileBytes = await File.ReadAllBytesAsync(fullPath, cancellationToken);
                var fileName = Path.GetFileName(fullPath);
                var contentType = GetContentType(fileName);

                return new FileDownloadResultDto
                {
                    FileContents = fileBytes,
                    ContentType = contentType,
                    FileName = fileName,
                    FileSize = fileBytes.Length
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file: {Path}", relativePath);
                return null;
            }
        }

        public async Task<bool> DeleteFileAsync(
            string relativePath,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Normalize path separators
                relativePath = relativePath.Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(_settings.BasePath, relativePath);

                // Security check - prevent directory traversal attacks
                var resolvedPath = Path.GetFullPath(fullPath);
                var resolvedBasePath = Path.GetFullPath(_settings.BasePath);

                if (!resolvedPath.StartsWith(resolvedBasePath, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "Directory traversal attempt detected on delete: {Path}",
                        relativePath);
                    return false;
                }

                if (!File.Exists(fullPath))
                {
                    _logger.LogWarning("File not found for deletion: {Path}", relativePath);
                    return false;
                }

                await Task.Run(() => File.Delete(fullPath), cancellationToken);
                _logger.LogInformation("File deleted: {Path}", relativePath);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {Path}", relativePath);
                return false;
            }
        }

        public bool ValidateFile(IFormFile file, out string errorMessage)
        {
            errorMessage = string.Empty;

            // Check if file exists
            if (file == null || file.Length == 0)
            {
                errorMessage = "No file provided or file is empty.";
                return false;
            }

            // Check file size
            if (file.Length > _settings.MaxFileSizeBytes)
            {
                var maxSizeMB = _settings.MaxFileSizeBytes / (1024 * 1024);
                errorMessage = $"File size exceeds maximum allowed size of {maxSizeMB}MB.";
                return false;
            }

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension))
            {
                errorMessage = "File must have an extension.";
                return false;
            }

            if (!_settings.AllowedExtensions.Contains(extension))
            {
                errorMessage = $"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", _settings.AllowedExtensions)}";
                return false;
            }

            // Basic content type validation
            if (!IsValidContentType(file.ContentType, extension))
            {
                errorMessage = "File content type does not match file extension.";
                return false;
            }

            return true;
        }

        public bool IsFolderAllowed(string folderName)
        {
            return _settings.AllowedFolders.Contains(folderName.ToLowerInvariant());
        }

        public string GetFileUrl(string relativePath)
        {
            if (string.IsNullOrEmpty(_settings.BaseUrl))
            {
                return relativePath;
            }

            var normalizedPath = relativePath.Replace("\\", "/");
            // Strip duplicate "api/files/" prefix if present (fixes existing bad stored paths)
            const string apiFilesPrefix = "api/files/";
            if (normalizedPath.StartsWith(apiFilesPrefix, StringComparison.OrdinalIgnoreCase))
                normalizedPath = normalizedPath.Substring(apiFilesPrefix.Length);
            return $"{_settings.BaseUrl.TrimEnd('/')}/{normalizedPath}";
        }

        #region Private Methods

        private void EnsureBaseDirectoryExists()
        {
            try
            {
                if (!Directory.Exists(_settings.BasePath))
                {
                    Directory.CreateDirectory(_settings.BasePath);
                    _logger.LogInformation("Created storage directory: {Path}", _settings.BasePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create storage directory: {Path}", _settings.BasePath);
                throw;
            }
        }

        private static string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        private static bool IsValidContentType(string contentType, string extension)
        {
            // Map of extensions to valid content types
            var validContentTypes = new Dictionary<string, string[]>
            {
                { ".pdf", new[] { "application/pdf" } },
                { ".jpg", new[] { "image/jpeg" } },
                { ".jpeg", new[] { "image/jpeg" } },
                { ".png", new[] { "image/png" } },
                { ".gif", new[] { "image/gif" } },
                { ".bmp", new[] { "image/bmp" } },
                { ".webp", new[] { "image/webp" } }
            };

            if (validContentTypes.TryGetValue(extension, out var validTypes))
            {
                return validTypes.Contains(contentType.ToLowerInvariant());
            }

            // If extension not in our map, allow it (basic check passed)
            return true;
        }

        #endregion
    }
}
