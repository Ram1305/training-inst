using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Requests.CourseCategory
{
    public class CategoryFilterRequestDto
    {
        public string? SearchQuery { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "DisplayOrder";
        public bool SortDescending { get; set; } = false;
    }
}
