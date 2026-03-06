namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews
{
    public class GoogleReviewFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsMainReview { get; set; }
        public int? Rating { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "DisplayOrder";
        public bool SortDescending { get; set; } = false;
    }
}
