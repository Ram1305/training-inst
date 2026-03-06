namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Student
{
    public class StudentStatsResponseDto
    {
        public int TotalStudents { get; set; }
        public int ActiveStudents { get; set; }
        public int InactiveStudents { get; set; }
        public int NewStudentsThisMonth { get; set; }
        public int StudentsWithEnrollments { get; set; }
        public int StudentsWithCompletedCourses { get; set; }
    }
}
