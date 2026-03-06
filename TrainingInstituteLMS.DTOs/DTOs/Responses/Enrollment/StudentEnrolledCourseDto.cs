namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    /// <summary>
    /// DTO for displaying a student's enrolled courses
    /// </summary>
    public class StudentEnrolledCourseDto
    {
        public Guid EnrollmentId { get; set; }
        public Guid CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? ImageUrl { get; set; }
        public string? Instructor { get; set; }
        public string? BatchCode { get; set; }
        public int Progress { get; set; }
        public int TheoryCompleted { get; set; }
        public int TheoryTotal { get; set; }
        public int PracticalCompleted { get; set; }
        public int PracticalTotal { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public DateTime? SelectedExamDate { get; set; }
        public DateTime? SelectedTheoryDate { get; set; }
        
        /// <summary>
        /// Indicates if the LLND quiz has been completed for this enrollment
        /// </summary>
        public bool QuizCompleted { get; set; }
    }
}
