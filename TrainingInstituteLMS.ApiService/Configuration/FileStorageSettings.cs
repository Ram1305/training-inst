namespace TrainingInstituteLMS.ApiService.Configuration
{
    public class FileStorageSettings
    {
        public const string SectionName = "FileStorage";

        /// <summary>
        /// Base path for file storage (relative or absolute)
        /// Development: "./Storage"
        /// Production: "D:\\LMS-Data" or "/var/lms-data"
        /// </summary>
        public string BasePath { get; set; } = "./Storage";

        /// <summary>
        /// Base URL for file access API
        /// </summary>
        public string BaseUrl { get; set; } = string.Empty;

        /// <summary>
        /// Maximum file size in bytes (default: 10MB)
        /// </summary>
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

        /// <summary>
        /// Allowed file extensions
        /// </summary>
        public string[] AllowedExtensions { get; set; } = { ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };

        /// <summary>
        /// Allowed upload folders (whitelist)
        /// For Azure Blob Storage, the first segment becomes the container name
        /// For local storage, subfolder paths are supported
        /// </summary>
        public string[] AllowedFolders { get; set; } = 
        { 
            "payment-receipts", 
            "certificates", 
            "documents", 
            "profile-photos", 
            "course-images",
            "course-resources",
            "gallery-images",
            // Student enrollment document container and subfolders
            "student-documents",
            "student-documents/primary-id",
            "student-documents/secondary-id",
            "student-documents/usi-id",
            "student-documents/qualifications",
            "student-documents/other"
        };

        // Azure Blob Storage
        public bool UseAzureStorage { get; set; } = false;
        public string? AzureConnectionString { get; set; }
    }
}
