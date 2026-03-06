using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz
{
    public class AdminBypassResponseDto
    {
        public Guid BypassId { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public Guid QuizAttemptId { get; set; }
        public Guid BypassedBy { get; set; }
        public string BypassedByName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime BypassedAt { get; set; }
        public bool IsActive { get; set; }
    }
}
