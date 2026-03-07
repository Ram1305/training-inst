namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Company
{
    public class CompanyFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public string? Status { get; set; } // "active", "inactive"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
