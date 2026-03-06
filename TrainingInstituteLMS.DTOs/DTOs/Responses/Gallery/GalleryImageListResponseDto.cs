using System.Collections.Generic;

namespace TrainingInstituteLMS.DTOs.DTOs.Responses.Gallery
{
    public class GalleryImageListResponseDto
    {
        public List<GalleryImageResponseDto> Images { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
