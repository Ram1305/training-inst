namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class BookingDetailsResponseDto
    {
        public DateTime Date { get; set; }
        public List<BookingDetailsCourseDto> Courses { get; set; } = new();
        public List<BookingDetailsEnrollmentDto> Enrollments { get; set; } = new();
    }
}
