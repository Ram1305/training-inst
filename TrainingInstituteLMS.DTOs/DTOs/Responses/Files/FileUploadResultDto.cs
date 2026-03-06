namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Files
{
    public class FileUploadResultDto
    {
        public bool Success { get; set; }
        public string? RelativePath { get; set; }
        public string? FileName { get; set; }
        public string? OriginalFileName { get; set; }
        public long FileSize { get; set; }
        public string? ContentType { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
