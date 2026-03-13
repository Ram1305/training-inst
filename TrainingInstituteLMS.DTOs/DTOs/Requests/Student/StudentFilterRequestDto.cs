namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Student
{
    public class StudentFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public string? Status { get; set; } // "active", "inactive"
        public string? CampusLocation { get; set; }
        public string? EmploymentType { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
