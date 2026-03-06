using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.SuperAdmin
{
    public class AdminFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public string? Status { get; set; } // "active", "inactive",
        public string? UserType { get; set; } // "Admin", "Teacher", 
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
