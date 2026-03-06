using System.ComponentModel.DataAnnotations;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment
{
    public class CreateEnrollmentRequestDto
    {
        [Required]
        public Guid CourseId { get; set; }

        /// <summary>
        /// Quiz attempt ID - now optional. Quiz can be taken after payment.
        /// </summary>
        public Guid? QuizAttemptId { get; set; }

        /// <summary>
        /// Selected exam date for the course (if applicable)
        /// </summary>
        public Guid? SelectedExamDateId { get; set; }

        /// <summary>
        /// Selected theory date for the course (if applicable)
        /// </summary>
        public Guid? SelectedTheoryDateId { get; set; }
    }
}
