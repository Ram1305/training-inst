using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.CourseCategory
{
    public class CategoryDropdownDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    public class CategoryDropdownListDto
    {
        public List<CategoryDropdownDto> Categories { get; set; } = new();
    }
}
