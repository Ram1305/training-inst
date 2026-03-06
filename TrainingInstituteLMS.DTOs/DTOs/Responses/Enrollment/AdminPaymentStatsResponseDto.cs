namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment
{
    public class AdminPaymentStatsResponseDto
    {
        public int PendingCount { get; set; }
        public int VerifiedCount { get; set; }
        public int RejectedCount { get; set; }
        public int TotalCount { get; set; }
        public decimal TotalVerifiedAmount { get; set; }
        public decimal TotalPendingAmount { get; set; }
        
        /// <summary>
        /// Recent payment activity for quick overview
        /// </summary>
        public List<RecentPaymentActivityDto> RecentActivity { get; set; } = new();
    }

    public class RecentPaymentActivityDto
    {
        public Guid PaymentProofId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ActivityDate { get; set; }
    }
}
