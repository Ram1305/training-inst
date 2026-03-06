using Microsoft.AspNetCore.Http;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Files;

namespace TrainingInstituteLMS.ApiService.Services.Files
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Upload a file to the specified subfolder
        /// </summary>
        /// <param name="file">The file to upload</param>
        /// <param name="subFolder">Subfolder name (e.g., "payment-receipts")</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Upload result with file path</returns>
        Task<FileUploadResultDto> UploadFileAsync(
            IFormFile file,
            string subFolder,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Get a file by its relative path
        /// </summary>
        /// <param name="relativePath">Relative path stored in database</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>File contents and metadata</returns>
        Task<FileDownloadResultDto?> GetFileAsync(
            string relativePath,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Delete a file by its relative path
        /// </summary>
        /// <param name="relativePath">Relative path stored in database</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>True if deleted successfully</returns>
        Task<bool> DeleteFileAsync(
            string relativePath,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Validate file before upload
        /// </summary>
        /// <param name="file">The file to validate</param>
        /// <param name="errorMessage">Error message if validation fails</param>
        /// <returns>True if valid</returns>
        bool ValidateFile(IFormFile file, out string errorMessage);

        /// <summary>
        /// Check if a folder name is allowed
        /// </summary>
        /// <param name="folderName">Folder name to check</param>
        /// <returns>True if allowed</returns>
        bool IsFolderAllowed(string folderName);

        /// <summary>
        /// Get the full URL for a file
        /// </summary>
        /// <param name="relativePath">Relative path stored in database</param>
        /// <returns>Full URL to access the file</returns>
        string GetFileUrl(string relativePath);
    }
}
