using System.Globalization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Course.CourseDate;
using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseDate;

namespace TrainingInstituteLMS.ApiService.Controllers.Course
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseDateController : ControllerBase
    {
        private readonly ICourseDateService _courseDateService;

        public CourseDateController(ICourseDateService courseDateService)
        {
            _courseDateService = courseDateService;
        }

        // GET: api/coursedate
        [HttpGet]
        public async Task<IActionResult> GetCourseDates([FromQuery] CourseDateFilterRequestDto filter)
        {
            try
            {
                var result = await _courseDateService.GetCourseDatesAsync(filter);
                return Ok(new { success = true, message = "Course dates retrieved successfully", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/coursedate/{courseDateId}
        [HttpGet("{courseDateId:guid}")]
        public async Task<IActionResult> GetCourseDateById(Guid courseDateId)
        {
            try
            {
                var result = await _courseDateService.GetCourseDateByIdAsync(courseDateId);
                if (result == null)
                {
                    return NotFound(new { success = false, message = "Course date not found" });
                }
                return Ok(new { success = true, message = "Course date retrieved successfully", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/coursedate/course/{courseId}
        [HttpGet("course/{courseId:guid}")]
        public async Task<IActionResult> GetCourseDatesForCourse(Guid courseId, [FromQuery] bool activeOnly = true, [FromQuery] string? fromDate = null)
        {
            try
            {
                // Parse fromDate (user's local today); fallback to UTC today so we never return past dates
                DateTime minDate = DateTime.UtcNow.Date;
                if (!string.IsNullOrEmpty(fromDate) && DateTime.TryParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                {
                    minDate = parsed.Date;
                }
                var result = await _courseDateService.GetCourseDatesForCourseAsync(courseId, activeOnly, minDate);
                return Ok(new { success = true, message = "Course dates retrieved successfully", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/coursedate
        [HttpPost]
        public async Task<IActionResult> CreateCourseDate([FromBody] CreateCourseDateRequestDto request)
        {
            try
            {
                var result = await _courseDateService.CreateCourseDateAsync(request);
                return CreatedAtAction(nameof(GetCourseDateById), new { courseDateId = result.CourseDateId },
                    new { success = true, message = "Course date created successfully", data = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/coursedate/bulk
        [HttpPost("bulk")]
        public async Task<IActionResult> BulkCreateCourseDates([FromBody] BulkCreateCourseDatesRequest request)
        {
            try
            {
                var result = await _courseDateService.BulkCreateCourseDatesAsync(
                    request.CourseId,
                    request.Dates,
                    request.DateType ?? "General"
                );

                if (result)
                {
                    return Ok(new { success = true, message = "Course dates created successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to create course dates" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT: api/coursedate/{courseDateId}
        [HttpPut("{courseDateId:guid}")]
        public async Task<IActionResult> UpdateCourseDate(Guid courseDateId, [FromBody] UpdateCourseDateRequestDto request)
        {
            try
            {
                var result = await _courseDateService.UpdateCourseDateAsync(courseDateId, request);
                if (result == null)
                {
                    return NotFound(new { success = false, message = "Course date not found" });
                }
                return Ok(new { success = true, message = "Course date updated successfully", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/coursedate/{courseDateId}
        [HttpDelete("{courseDateId:guid}")]
        public async Task<IActionResult> DeleteCourseDate(Guid courseDateId)
        {
            try
            {
                var (success, wasDeactivated) = await _courseDateService.DeleteCourseDateAsync(courseDateId);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Course date not found" });
                }
                return Ok(new
                {
                    success = true,
                    message = wasDeactivated
                        ? "Course date has enrollments and was deactivated instead of deleted"
                        : "Course date deleted successfully",
                    wasDeactivated
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/coursedate/bulk
        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDeleteCourseDates([FromBody] BulkDeleteCourseDatesRequest request)
        {
            try
            {
                var result = await _courseDateService.BulkDeleteCourseDatesAsync(request.CourseId, request.CourseDateIds);
                if (!result)
                {
                    return BadRequest(new { success = false, message = "No course dates were deleted" });
                }
                return Ok(new { success = true, message = "Course dates deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PATCH: api/coursedate/{courseDateId}/toggle-status
        [HttpPatch("{courseDateId:guid}/toggle-status")]
        public async Task<IActionResult> ToggleCourseDateStatus(Guid courseDateId)
        {
            try
            {
                var result = await _courseDateService.ToggleCourseDateStatusAsync(courseDateId);
                if (!result)
                {
                    return NotFound(new { success = false, message = "Course date not found" });
                }
                return Ok(new { success = true, message = "Course date status toggled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // Request models for bulk operations
    public class BulkCreateCourseDatesRequest
    {
        public Guid CourseId { get; set; }
        public List<DateTime> Dates { get; set; } = new();
        public string? DateType { get; set; }
    }

    public class BulkDeleteCourseDatesRequest
    {
        public Guid CourseId { get; set; }
        public List<Guid> CourseDateIds { get; set; } = new();
    }
}
