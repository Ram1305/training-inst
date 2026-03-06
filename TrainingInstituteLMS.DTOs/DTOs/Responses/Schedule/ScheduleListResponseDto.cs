namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule
{
    public class ScheduleListResponseDto
    {
        public List<ScheduleResponseDto> Schedules { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
