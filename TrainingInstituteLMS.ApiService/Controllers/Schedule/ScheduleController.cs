using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Schedule;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule;

namespace TrainingInstituteLMS.ApiService.Controllers.Schedule
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;

        public ScheduleController(IScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        /// <summary>
        /// Get all schedules with filtering and pagination
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<ScheduleListResponseDto>>> GetSchedules([FromQuery] ScheduleFilterRequestDto filter)
        {
            try
            {
                var result = await _scheduleService.GetSchedulesAsync(filter);
                return Ok(new ApiResponse<ScheduleListResponseDto>
                {
                    Success = true,
                    Message = "Schedules retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ScheduleListResponseDto>
                {
                    Success = false,
                    Message = $"Error retrieving schedules: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get schedules for calendar view
        /// </summary>
        [HttpGet("calendar")]
        public async Task<ActionResult<ApiResponse<List<ScheduleCalendarDto>>>> GetSchedulesForCalendar(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] Guid? courseId = null)
        {
            try
            {
                var result = await _scheduleService.GetSchedulesForCalendarAsync(fromDate, toDate, courseId);
                return Ok(new ApiResponse<List<ScheduleCalendarDto>>
                {
                    Success = true,
                    Message = "Calendar schedules retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<ScheduleCalendarDto>>
                {
                    Success = false,
                    Message = $"Error retrieving calendar schedules: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get schedule by ID
        /// </summary>
        [HttpGet("{scheduleId:guid}")]
        public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> GetScheduleById(Guid scheduleId)
        {
            try
            {
                var result = await _scheduleService.GetScheduleByIdAsync(scheduleId);
                if (result == null)
                {
                    return NotFound(new ApiResponse<ScheduleResponseDto>
                    {
                        Success = false,
                        Message = "Schedule not found"
                    });
                }

                return Ok(new ApiResponse<ScheduleResponseDto>
                {
                    Success = true,
                    Message = "Schedule retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ScheduleResponseDto>
                {
                    Success = false,
                    Message = $"Error retrieving schedule: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Create a new schedule
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> CreateSchedule([FromBody] CreateScheduleRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<ScheduleResponseDto>
                    {
                        Success = false,
                        Message = "Invalid request data"
                    });
                }

                var result = await _scheduleService.CreateScheduleAsync(request);
                return CreatedAtAction(nameof(GetScheduleById), new { scheduleId = result.ScheduleId }, new ApiResponse<ScheduleResponseDto>
                {
                    Success = true,
                    Message = "Schedule created successfully",
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<ScheduleResponseDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ScheduleResponseDto>
                {
                    Success = false,
                    Message = $"Error creating schedule: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Update an existing schedule
        /// </summary>
        [HttpPut("{scheduleId:guid}")]
        public async Task<ActionResult<ApiResponse<ScheduleResponseDto>>> UpdateSchedule(Guid scheduleId, [FromBody] UpdateScheduleRequestDto request)
        {
            try
            {
                var result = await _scheduleService.UpdateScheduleAsync(scheduleId, request);
                if (result == null)
                {
                    return NotFound(new ApiResponse<ScheduleResponseDto>
                    {
                        Success = false,
                        Message = "Schedule not found"
                    });
                }

                return Ok(new ApiResponse<ScheduleResponseDto>
                {
                    Success = true,
                    Message = "Schedule updated successfully",
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<ScheduleResponseDto>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ScheduleResponseDto>
                {
                    Success = false,
                    Message = $"Error updating schedule: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Delete a schedule. If it has enrollments, deactivates instead.
        /// </summary>
        [HttpDelete("{scheduleId:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteSchedule(Guid scheduleId)
        {
            try
            {
                var (success, wasDeactivated) = await _scheduleService.DeleteScheduleAsync(scheduleId);
                if (!success)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Schedule not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = wasDeactivated
                        ? "Schedule has enrollments and was deactivated instead of deleted"
                        : "Schedule deleted successfully",
                    Data = new { wasDeactivated }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Error deleting schedule: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Delete old schedules (past dates with no enrollments)
        /// </summary>
        [HttpDelete("old")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteOldSchedules()
        {
            try
            {
                var deletedCount = await _scheduleService.DeleteOldSchedulesAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = deletedCount > 0
                        ? $"{deletedCount} old schedule(s) deleted successfully"
                        : "No old schedules to delete",
                    Data = new { deletedCount }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Error deleting old schedules: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Update schedule status
        /// </summary>
        [HttpPatch("{scheduleId:guid}/status")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateScheduleStatus(Guid scheduleId, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var result = await _scheduleService.UpdateScheduleStatusAsync(scheduleId, request.Status);
                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Schedule not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Schedule status updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Error updating schedule status: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get schedules for a student based on their verified enrollments
        /// </summary>
        [HttpGet("student/{studentId:guid}/calendar")]
        public async Task<ActionResult<ApiResponse<List<StudentScheduleCalendarDto>>>> GetStudentScheduleForCalendar(
            Guid studentId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var result = await _scheduleService.GetStudentScheduleForCalendarAsync(studentId, fromDate, toDate);
                return Ok(new ApiResponse<List<StudentScheduleCalendarDto>>
                {
                    Success = true,
                    Message = "Student schedule retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<StudentScheduleCalendarDto>>
                {
                    Success = false,
                    Message = $"Error retrieving student schedule: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get schedules for a teacher based on their assigned courses
        /// </summary>
        [HttpGet("teacher/{teacherId:guid}/calendar")]
        public async Task<ActionResult<ApiResponse<List<TeacherScheduleCalendarDto>>>> GetTeacherScheduleForCalendar(
            Guid teacherId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var result = await _scheduleService.GetTeacherScheduleForCalendarAsync(teacherId, fromDate, toDate);
                return Ok(new ApiResponse<List<TeacherScheduleCalendarDto>>
                {
                    Success = true,
                    Message = "Teacher schedule retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<TeacherScheduleCalendarDto>>
                {
                    Success = false,
                    Message = $"Error retrieving teacher schedule: {ex.Message}"
                });
            }
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
