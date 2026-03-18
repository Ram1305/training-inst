namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class BookingDetailsEnrollmentDto
    {
        public Guid EnrollmentId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string CourseType { get; set; } = "Single";
        public string? SessionTime { get; set; }
        public string? Location { get; set; }
        public string? SessionType { get; set; } // Exam, Theory, Practical
        public string PaymentStatus { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        /// <summary>Individual or Company - how the student enrolled.</summary>
        public string? EnrollmentType { get; set; }

        /// <summary>
        /// Name of the company if enrolled via company order.
        /// </summary>
        public string? CompanyName { get; set; }
    }
}
