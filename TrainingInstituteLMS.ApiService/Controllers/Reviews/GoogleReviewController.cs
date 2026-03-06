using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Reviews;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Reviews;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Reviews
{
    [Route("api/googlereview")]
    [ApiController]
    public class GoogleReviewController : ControllerBase
    {
        private readonly IGoogleReviewService _googleReviewService;

        public GoogleReviewController(IGoogleReviewService googleReviewService)
        {
            _googleReviewService = googleReviewService;
        }

        /// <summary>
        /// Get active reviews for the landing page (public)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetPublicReviews()
        {
            try
            {
                var result = await _googleReviewService.GetPublicReviewsAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Reviews retrieved successfully",
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
        /// Get review statistics (admin)
        /// </summary>
        [HttpGet("admin/stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var result = await _googleReviewService.GetStatsAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Stats retrieved successfully",
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
        /// Get all reviews for admin with filtering and pagination
        /// </summary>
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllAdmin([FromQuery] GoogleReviewFilterRequestDto filter)
        {
            try
            {
                var result = await _googleReviewService.GetAllAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Reviews retrieved successfully",
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
        /// Get review by ID (admin)
        /// </summary>
        [HttpGet("admin/{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var result = await _googleReviewService.GetByIdAsync(id);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Review retrieved successfully",
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
        /// Create a new review (admin)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGoogleReviewRequestDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Author))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Author is required"
                    });
                }

                if (string.IsNullOrWhiteSpace(request.ReviewText))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review text is required"
                    });
                }

                if (request.Rating < 1 || request.Rating > 5)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Rating must be between 1 and 5"
                    });
                }

                var result = await _googleReviewService.CreateAsync(request, null);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to create review"
                    });
                }

                return CreatedAtAction(nameof(GetById), new { id = result.GoogleReviewId }, new ApiResponse<object>
                {
                    Success = true,
                    Message = "Review created successfully",
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
        /// Update an existing review (admin)
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGoogleReviewRequestDto request)
        {
            try
            {
                if (request.Rating.HasValue && (request.Rating.Value < 1 || request.Rating.Value > 5))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Rating must be between 1 and 5"
                    });
                }

                var result = await _googleReviewService.UpdateAsync(id, request);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review not found or update failed"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Review updated successfully",
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
        /// Delete a review (admin)
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var result = await _googleReviewService.DeleteAsync(id);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Review deleted successfully"
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
        /// Reorder reviews (admin)
        /// </summary>
        [HttpPost("reorder")]
        public async Task<IActionResult> Reorder([FromBody] Guid[] ids)
        {
            try
            {
                if (ids == null || ids.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review IDs are required"
                    });
                }

                var result = await _googleReviewService.ReorderAsync(ids);

                if (!result)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid review IDs provided"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Reviews reordered successfully"
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
        /// Toggle review active status (admin)
        /// </summary>
        [HttpPatch("{id:guid}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(Guid id)
        {
            try
            {
                var result = await _googleReviewService.ToggleStatusAsync(id);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Review not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Review status toggled successfully"
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
