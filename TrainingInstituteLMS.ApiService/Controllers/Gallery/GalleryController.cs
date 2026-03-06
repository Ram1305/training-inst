using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Gallery;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Gallery;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Gallery
{
    [ApiController]
    [Route("api/gallery")]
    public class GalleryController : ControllerBase
    {
        private readonly IGalleryService _galleryService;

        public GalleryController(IGalleryService galleryService)
        {
            _galleryService = galleryService;
        }

        /// <summary>
        /// Get active gallery images for the public page
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetPublicImages()
        {
            try
            {
                var result = await _galleryService.GetPublicImagesAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery images retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get all gallery images for admin with filtering
        /// </summary>
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllAdmin([FromQuery] GalleryImageFilterRequestDto filter)
        {
            try
            {
                var result = await _galleryService.GetAllAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery images retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get gallery image by ID (admin)
        /// </summary>
        [HttpGet("admin/{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _galleryService.GetByIdAsync(id);
                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Gallery image not found"
                    });
                }
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery image retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Create a new gallery image (admin)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGalleryImageRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Title is required"
                    });
                }

                if (string.IsNullOrWhiteSpace(request.ImageUrl))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Image is required"
                    });
                }

                var result = await _galleryService.CreateAsync(request, null);
                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to create gallery image. Invalid image format."
                    });
                }

                return CreatedAtAction(nameof(GetById), new { id = result.GalleryImageId }, new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery image created successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Update a gallery image (admin)
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGalleryImageRequestDto request)
        {
            try
            {
                var result = await _galleryService.UpdateAsync(id, request);
                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Gallery image not found"
                    });
                }
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery image updated successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Delete a gallery image (admin)
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var result = await _galleryService.DeleteAsync(id);
                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Gallery image not found"
                    });
                }
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gallery image deleted successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }
    }
}
