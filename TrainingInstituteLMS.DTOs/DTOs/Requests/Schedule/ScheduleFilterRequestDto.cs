namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule
{
    public class ScheduleFilterRequestDto
    {
        public Guid? CourseId { get; set; }
        public string? EventType { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Status { get; set; }
        public string? Location { get; set; }

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;

        // Sorting
        public string? SortBy { get; set; } = "ScheduledDate";
        public bool SortDescending { get; set; } = false;
    }
}
