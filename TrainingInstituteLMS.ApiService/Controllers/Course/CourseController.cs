using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Course;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Course;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Course
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        /// <summary>
        /// Get all courses with filtering, sorting, and pagination
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllCourses([FromQuery] CourseFilterRequestDto filter)
        {
            try
            {
                var result = await _courseService.GetAllCoursesAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Courses retrieved successfully",
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
        /// Get active courses only (for public landing page)
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveCourses([FromQuery] CourseFilterRequestDto filter)
        {
            try
            {
                var result = await _courseService.GetActiveCoursesAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Active courses retrieved successfully",
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
        /// Get featured courses for landing page
        /// </summary>
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedCourses([FromQuery] int count = 6)
        {
            try
            {
                var result = await _courseService.GetFeaturedCoursesAsync(count);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Featured courses retrieved successfully",
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
        /// Get course by ID
        /// </summary>
        [HttpGet("{courseId:guid}")]
        public async Task<IActionResult> GetCourseById(Guid courseId)
        {
            try
            {
                var result = await _courseService.GetCourseByIdAsync(courseId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course retrieved successfully",
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
        /// Get course by code
        /// </summary>
        [HttpGet("code/{courseCode}")]
        public async Task<IActionResult> GetCourseByCode(string courseCode)
        {
            try
            {
                var result = await _courseService.GetCourseByCodeAsync(courseCode);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course retrieved successfully",
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
        /// Create a new course (Admin only)
        /// </summary>
        [HttpPost]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequestDto request)
        {
            try
            {
                if (await _courseService.CourseCodeExistsAsync(request.CourseCode))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course code already exists"
                    });
                }

                Guid? createdBy = null;

                var result = await _courseService.CreateCourseAsync(request, createdBy);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to create course. Please check if the category exists."
                    });
                }

                return CreatedAtAction(nameof(GetCourseById), new { courseId = result.CourseId }, new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course created successfully",
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
        /// Update an existing course (Admin only)
        /// </summary>
        [HttpPut("{courseId:guid}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UpdateCourse(Guid courseId, [FromBody] UpdateCourseRequestDto request)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request.CourseCode) &&
                    await _courseService.CourseCodeExistsAsync(request.CourseCode, courseId))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course code already exists"
                    });
                }

                var result = await _courseService.UpdateCourseAsync(courseId, request);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course not found or update failed"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course updated successfully",
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
        /// Delete a course (Admin only)
        /// </summary>
        [HttpDelete("{courseId:guid}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> DeleteCourse(Guid courseId)
        {
            try
            {
                var result = await _courseService.DeleteCourseAsync(courseId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course deleted successfully"
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
        /// Toggle course active status (Admin only)
        /// </summary>
        [HttpPatch("{courseId:guid}/toggle-status")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ToggleCourseStatus(Guid courseId)
        {
            try
            {
                var result = await _courseService.ToggleCourseStatusAsync(courseId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course status toggled successfully"
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
        /// Get course statistics (Admin only)
        /// </summary>
        [HttpGet("stats")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetCourseStats()
        {
            try
            {
                var result = await _courseService.GetCourseStatsAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course statistics retrieved successfully",
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
        /// Reorder courses within a category (Admin only, for landing page display)
        /// </summary>
        [HttpPost("reorder")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ReorderCourses([FromQuery] Guid categoryId, [FromBody] Guid[] courseIds)
        {
            try
            {
                if (courseIds == null || courseIds.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Course IDs are required"
                    });
                }

                var result = await _courseService.ReorderCoursesAsync(categoryId, courseIds);

                if (!result)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid course IDs or not all courses belong to the specified category"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Courses reordered successfully"
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
        /// Check if course code exists
        /// </summary>
        [HttpGet("check-code/{courseCode}")]
        public async Task<IActionResult> CheckCourseCode(string courseCode, [FromQuery] Guid? excludeCourseId = null)
        {
            try
            {
                var exists = await _courseService.CourseCodeExistsAsync(courseCode, excludeCourseId);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = exists ? "Course code exists" : "Course code is available",
                    Data = new { Exists = exists }
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
