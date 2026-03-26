using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Banners;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Banners
{
    [ApiController]
    [Route("api/public/banners")]
    public class PublicBannersController : ControllerBase
    {
        private readonly IBannerService _bannerService;

        public PublicBannersController(IBannerService bannerService)
        {
            _bannerService = bannerService;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var result = await _bannerService.GetActivePublicAsync();
            return Ok(ApiResponse<object>.SuccessResponse(result, "Active banners retrieved successfully"));
        }
    }
}

