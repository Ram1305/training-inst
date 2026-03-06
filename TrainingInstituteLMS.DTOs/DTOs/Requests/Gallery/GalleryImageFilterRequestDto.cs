namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery
{
    public class GalleryImageFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "DisplayOrder";
        public bool SortDescending { get; set; } = false;
    }
}
