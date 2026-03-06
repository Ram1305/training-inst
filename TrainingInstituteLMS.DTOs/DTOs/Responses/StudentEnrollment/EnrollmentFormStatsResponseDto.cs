using System;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.StudentEnrollment
{
    /// <summary>
    /// Stats for enrollment forms (admin dashboard)
    /// </summary>
    public class EnrollmentFormStatsResponseDto
    {
        public int TotalSubmitted { get; set; }
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public int NotSubmittedCount { get; set; }
        public DateTime? LastSubmittedAt { get; set; }
        public DateTime? LastReviewedAt { get; set; }
    }
}
