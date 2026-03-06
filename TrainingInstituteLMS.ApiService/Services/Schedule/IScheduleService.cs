using TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule;

namespace TrainingInstituteLMS.ApiService.Services.Schedule
{
    public interface IScheduleService
    {
        Task<ScheduleResponseDto> CreateScheduleAsync(CreateScheduleRequestDto request, Guid? createdBy = null);
        Task<ScheduleResponseDto?> GetScheduleByIdAsync(Guid scheduleId);
        Task<ScheduleListResponseDto> GetSchedulesAsync(ScheduleFilterRequestDto filter);
        Task<List<ScheduleCalendarDto>> GetSchedulesForCalendarAsync(DateTime? fromDate = null, DateTime? toDate = null, Guid? courseId = null);
        Task<ScheduleResponseDto?> UpdateScheduleAsync(Guid scheduleId, UpdateScheduleRequestDto request);
        /// <summary>
        /// Deletes a schedule. If it has enrollments, deactivates instead.
        /// </summary>
        /// <returns>Tuple of (success, wasDeactivated). wasDeactivated is true when deactivated due to enrollments.</returns>
        Task<(bool Success, bool WasDeactivated)> DeleteScheduleAsync(Guid scheduleId);

        /// <summary>
        /// Deletes old schedules (past dates) that have no enrollments.
        /// </summary>
        /// <returns>Number of schedules deleted.</returns>
        Task<int> DeleteOldSchedulesAsync();
        Task<bool> UpdateScheduleStatusAsync(Guid scheduleId, string status);
        Task<List<StudentScheduleCalendarDto>> GetStudentScheduleForCalendarAsync(Guid studentId, DateTime? fromDate = null, DateTime? toDate = null);
        Task<List<TeacherScheduleCalendarDto>> GetTeacherScheduleForCalendarAsync(Guid teacherId, DateTime? fromDate = null, DateTime? toDate = null);
    }
}
