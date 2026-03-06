namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class WeeklyBookingStatsDto
    {
        public List<DailyBookingStatDto> DailyStats { get; set; } = new();
    }

    public class DailyBookingStatDto
    {
        public DateTime Date { get; set; }
        public int TotalCount { get; set; }
    }
}
