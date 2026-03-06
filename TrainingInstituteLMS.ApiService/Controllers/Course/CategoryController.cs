using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Course.CourseCategory;
using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseCategory;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Course
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        /// <summary>
        /// Get all categories with filtering and pagination
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllCategories([FromQuery] CategoryFilterRequestDto filter)
        {
            try
            {
                var result = await _categoryService.GetAllCategoriesAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Categories retrieved successfully",
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
        /// Get categories for dropdown selection (active only)
        /// </summary>
        [HttpGet("dropdown")]
        public async Task<IActionResult> GetCategoriesDropdown()
        {
            try
            {
                var result = await _categoryService.GetCategoriesForDropdownAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Categories retrieved successfully",
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
        /// Get category by ID
        /// </summary>
        [HttpGet("{categoryId:guid}")]
        public async Task<IActionResult> GetCategoryById(Guid categoryId)
        {
            try
            {
                var result = await _categoryService.GetCategoryByIdAsync(categoryId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Category retrieved successfully",
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
        /// Create a new category (Admin only)
        /// </summary>
        [HttpPost]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequestDto request)
        {
            try
            {
                // Validate
                if (string.IsNullOrWhiteSpace(request.CategoryName))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category name is required"
                    });
                }

                // Check if name exists
                if (await _categoryService.CategoryNameExistsAsync(request.CategoryName))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category name already exists"
                    });
                }

                Guid? createdBy = null;
                // Get from auth claims when implemented

                var result = await _categoryService.CreateCategoryAsync(request, createdBy);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to create category"
                    });
                }

                return CreatedAtAction(nameof(GetCategoryById), new { categoryId = result.CategoryId }, new ApiResponse<object>
                {
                    Success = true,
                    Message = "Category created successfully",
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
        /// Update an existing category (Admin only)
        /// </summary>
        [HttpPut("{categoryId:guid}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UpdateCategory(Guid categoryId, [FromBody] UpdateCategoryRequestDto request)
        {
            try
            {
                // Check if new name already exists
                if (!string.IsNullOrWhiteSpace(request.CategoryName) &&
                    await _categoryService.CategoryNameExistsAsync(request.CategoryName, categoryId))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category name already exists"
                    });
                }

                var result = await _categoryService.UpdateCategoryAsync(categoryId, request);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category not found or update failed"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Category updated successfully",
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
        /// Delete a category (Admin only)
        /// </summary>
        [HttpDelete("{categoryId:guid}")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> DeleteCategory(Guid categoryId)
        {
            try
            {
                // Check if category has courses
                var hasCourses = await _categoryService.CategoryHasCoursesAsync(categoryId);

                var result = await _categoryService.DeleteCategoryAsync(categoryId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = hasCourses
                        ? "Category has courses and was deactivated instead of deleted"
                        : "Category deleted successfully"
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
        /// Toggle category active status (Admin only)
        /// </summary>
        [HttpPatch("{categoryId:guid}/toggle-status")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ToggleCategoryStatus(Guid categoryId)
        {
            try
            {
                var result = await _categoryService.ToggleCategoryStatusAsync(categoryId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Category status toggled successfully"
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
        /// Reorder categories (Admin only)
        /// </summary>
        [HttpPost("reorder")]
        // [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> ReorderCategories([FromBody] Guid[] categoryIds)
        {
            try
            {
                if (categoryIds == null || categoryIds.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Category IDs are required"
                    });
                }

                var result = await _categoryService.ReorderCategoriesAsync(categoryIds);

                if (!result)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid category IDs provided"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Categories reordered successfully"
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
        /// Check if category name exists
        /// </summary>
        [HttpGet("check-name/{categoryName}")]
        public async Task<IActionResult> CheckCategoryName(string categoryName, [FromQuery] Guid? excludeCategoryId = null)
        {
            try
            {
                var exists = await _categoryService.CategoryNameExistsAsync(categoryName, excludeCategoryId);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = exists ? "Category name exists" : "Category name is available",
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
