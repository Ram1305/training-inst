using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Banners;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Banners;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Banners
{
    [ApiController]
    [Route("api/admin/banners")]
    public class AdminBannersController : ControllerBase
    {
        private readonly IBannerService _bannerService;

        public AdminBannersController(IBannerService bannerService)
        {
            _bannerService = bannerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _bannerService.GetAllAdminAsync();
            return Ok(ApiResponse<object>.SuccessResponse(result, "Banners retrieved successfully"));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _bannerService.GetByIdAsync(id);
            if (result == null)
                return NotFound(ApiResponse<object>.FailureResponse("Banner not found"));

            return Ok(ApiResponse<object>.SuccessResponse(result, "Banner retrieved successfully"));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBannerRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(ApiResponse<object>.FailureResponse("Title is required"));
            if (string.IsNullOrWhiteSpace(request.ImagePath))
                return BadRequest(ApiResponse<object>.FailureResponse("ImagePath is required"));

            var created = await _bannerService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.BannerId }, ApiResponse<object>.SuccessResponse(created, "Banner created successfully"));
        }

        [HttpPatch("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBannerRequestDto request)
        {
            var updated = await _bannerService.UpdateAsync(id, request);
            if (updated == null)
                return NotFound(ApiResponse<object>.FailureResponse("Banner not found"));

            return Ok(ApiResponse<object>.SuccessResponse(updated, "Banner updated successfully"));
        }

        [HttpPatch("{id:guid}/toggle")]
        public async Task<IActionResult> Toggle(Guid id)
        {
            var updated = await _bannerService.ToggleAsync(id);
            if (updated == null)
                return NotFound(ApiResponse<object>.FailureResponse("Banner not found"));

            return Ok(ApiResponse<object>.SuccessResponse(updated, "Banner status updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _bannerService.DeleteAsync(id);
            if (!deleted)
                return NotFound(ApiResponse<object>.FailureResponse("Banner not found"));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Banner deleted successfully"));
        }
    }
}

