using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.SuperAdmin
{
    public class AdminStatsResponseDto
    {
        public int TotalAdmins { get; set; }
        public int ActiveAdmins { get; set; }
        public int InactiveAdmins { get; set; }
        public int TotalTeachers { get; set; }
        public int ActiveTeachers { get; set; }
        public int TotalUsers { get; set; }
        public int NewAdminsThisMonth { get; set; }
        public int NewTeachersThisMonth { get; set; }
    }
}
