namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Company
{
    public class CompanyListResponseDto
    {
        public List<CompanyResponseDto> Companies { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
