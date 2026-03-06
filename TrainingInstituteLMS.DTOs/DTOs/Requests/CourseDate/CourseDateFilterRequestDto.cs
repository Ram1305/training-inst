using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.CourseDate
{
    public class CourseDateFilterRequestDto
    {
        public Guid? CourseId { get; set; }
        public string? DateType { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public bool? IsActive { get; set; }
        public bool? HasAvailability { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "ScheduledDate";
        public bool SortDescending { get; set; } = false;
    }
}
