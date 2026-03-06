using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Files;

namespace TrainingInstituteLMS.ApiService.Controllers.Files
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<FilesController> _logger;

        public FilesController(
            IFileStorageService fileStorageService,
            ILogger<FilesController> logger)
        {
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        /// <summary>
        /// Upload a file to the specified folder
        /// </summary>
        /// <param name="folder">Target folder (e.g., payment-receipts, certificates)</param>
        /// <param name="file">The file to upload</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Upload result with file path</returns>
        [HttpPost("upload/{folder}")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<IActionResult> UploadFile(
            string folder,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            if (file == null)
            {
                return BadRequest(new { success = false, message = "No file provided." });
            }

            // Validate folder name
            if (!_fileStorageService.IsFolderAllowed(folder))
            {
                _logger.LogWarning("Upload attempt to invalid folder: {Folder}", folder);
                return BadRequest(new { success = false, message = "Invalid folder specified." });
            }

            try
            {
                var result = await _fileStorageService.UploadFileAsync(file, folder, cancellationToken);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Storage error during file upload to folder {Folder}", folder);
                return StatusCode(500, new { success = false, message = "File storage is temporarily unavailable. Please try again later." });
            }
        }

        /// <summary>
        /// Upload multiple files to the specified folder
        /// </summary>
        /// <param name="folder">Target folder</param>
        /// <param name="files">The files to upload</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Upload results for each file</returns>
        [HttpPost("upload-multiple/{folder}")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50MB total limit for multiple files
        public async Task<IActionResult> UploadMultipleFiles(
            string folder,
            IFormFileCollection files,
            CancellationToken cancellationToken)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { success = false, message = "No files provided." });
            }

            // Validate folder name
            if (!_fileStorageService.IsFolderAllowed(folder))
            {
                _logger.LogWarning("Upload attempt to invalid folder: {Folder}", folder);
                return BadRequest(new { success = false, message = "Invalid folder specified." });
            }

            try
            {
                var results = new List<object>();
                var allSuccessful = true;

                foreach (var file in files)
                {
                    var result = await _fileStorageService.UploadFileAsync(file, folder, cancellationToken);
                    results.Add(result);

                    if (!result.Success)
                    {
                        allSuccessful = false;
                    }
                }

                return Ok(new
                {
                    success = allSuccessful,
                    totalFiles = files.Count,
                    successfulUploads = results.Count(r => ((dynamic)r).Success),
                    results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Storage error during multiple file upload to folder {Folder}", folder);
                return StatusCode(500, new { success = false, message = "File storage is temporarily unavailable. Please try again later." });
            }
        }

        /// <summary>
        /// Get/Download a file by its path
        /// </summary>
        /// <param name="filePath">Relative file path</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>File content</returns>
        [HttpGet("{*filePath}")]
        public async Task<IActionResult> GetFile(
            string filePath,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return BadRequest(new { success = false, message = "File path is required." });
            }

            var decodedPath = Uri.UnescapeDataString(filePath);
            var result = await _fileStorageService.GetFileAsync(decodedPath, cancellationToken);

            if (result == null)
            {
                return NotFound(new { success = false, message = "File not found." });
            }

            return File(result.FileContents, result.ContentType, result.FileName);
        }

        /// <summary>
        /// Delete a file by its path
        /// </summary>
        /// <param name="filePath">Relative file path</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Success status</returns>
        [HttpDelete("{*filePath}")]
        public async Task<IActionResult> DeleteFile(
            string filePath,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return BadRequest(new { success = false, message = "File path is required." });
            }

            var decodedPath = Uri.UnescapeDataString(filePath);
            
            // CRITICAL: Log ALL deletion attempts with complete context
            _logger.LogWarning(
                "?? FILE DELETE REQUEST - Path: {FilePath}, User: {User}, IP: {IP}, Time: {Time}, UserAgent: {UserAgent}, Referer: {Referer}", 
                decodedPath, 
                User.Identity?.Name ?? "Anonymous", 
                HttpContext.Connection.RemoteIpAddress?.ToString(), 
                DateTime.UtcNow,
                HttpContext.Request.Headers["User-Agent"].ToString(),
                HttpContext.Request.Headers["Referer"].ToString());

            var success = await _fileStorageService.DeleteFileAsync(decodedPath, cancellationToken);

            if (!success)
            {
                _logger.LogWarning("Delete failed - File not found or already deleted: {FilePath}", decodedPath);
                return NotFound(new { success = false, message = "File not found or could not be deleted." });
            }

            _logger.LogWarning("? FILE SUCCESSFULLY DELETED: {FilePath}", decodedPath);
            return Ok(new { success = true, message = "File deleted successfully." });
        }

        /// <summary>
        /// Check if a file exists
        /// </summary>
        /// <param name="filePath">Relative file path</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Existence status</returns>
        [HttpHead("{*filePath}")]
        public async Task<IActionResult> CheckFileExists(
            string filePath,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return BadRequest();
            }

            var decodedPath = Uri.UnescapeDataString(filePath);
            var result = await _fileStorageService.GetFileAsync(decodedPath, cancellationToken);

            if (result == null)
            {
                return NotFound();
            }

            Response.Headers.ContentLength = result.FileSize;
            Response.Headers.ContentType = result.ContentType;

            return Ok();
        }
    }
}
