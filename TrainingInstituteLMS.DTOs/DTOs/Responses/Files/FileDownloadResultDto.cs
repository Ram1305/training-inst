namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Files
{
    public class FileDownloadResultDto
    {
        public byte[] FileContents { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
    }
}
