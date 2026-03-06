using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class QuizStatisticsResponseDto
    {
        public int TotalAttempts { get; set; }
        public int PassedCount { get; set; }
        public int FailedCount { get; set; }
        public int PendingReviewCount { get; set; }
        public int ApprovedBypassCount { get; set; }
        public int RejectedCount { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
    }
}
