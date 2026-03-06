using System.Collections.Generic;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Reviews
{
    public class GoogleReviewListResponseDto
    {
        public List<GoogleReviewResponseDto> Reviews { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
