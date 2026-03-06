namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    /// <summary>
    /// Response DTO for course booking
    /// </summary>
    public class BookCourseResponseDto
    {
        public Guid UserId { get; set; }
        public Guid StudentId { get; set; }
        public Guid EnrollmentId { get; set; }
        public Guid PaymentProofId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public DateTime SelectedDate { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string EnrollmentStatus { get; set; } = string.Empty;
        public DateTime BookedAt { get; set; }
    }
}