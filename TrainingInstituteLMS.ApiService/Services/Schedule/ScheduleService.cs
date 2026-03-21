using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.ApiService.Common;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Schedule;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Schedule;
using CourseEntity = TrainingInstituteLMS.Data.Entities.Courses.Course;

namespace TrainingInstituteLMS.ApiService.Services.Schedule
{
    /// <summary>
    /// Schedule service that uses CourseDate as the single source of truth.
    /// This ensures synchronization between the calendar view and course date management.
    /// </summary>
    public class ScheduleService : IScheduleService
    {
        private readonly TrainingLMSDbContext _context;

        public ScheduleService(TrainingLMSDbContext context)
        {
            _context = context;
        }

        public async Task<ScheduleResponseDto> CreateScheduleAsync(CreateScheduleRequestDto request, Guid? createdBy = null)
        {
            // Validate course exists
            var course = await _context.Courses.FindAsync(request.CourseId);
            if (course == null)
            {
                throw new ArgumentException("Course not found");
            }

            // Validate teacher if provided
            User? teacher = null;
            if (request.TeacherId.HasValue)
            {
                teacher = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == request.TeacherId.Value && u.IsActive);
                
                if (teacher == null)
                {
                    throw new ArgumentException("Teacher not found or inactive");
                }
            }

            // Normalize the scheduled date
            var normalizedDate = request.ScheduledDate.Date;

            // Map event type to date type
            var dateType = MapEventTypeToDateType(request.EventType);

            TimeSpan? startTime = null;
            TimeSpan? endTime = null;
            
            if (!string.IsNullOrEmpty(request.StartTime) && TimeSpan.TryParse(request.StartTime, out var st))
            {
                startTime = st;
            }
            
            if (!string.IsNullOrEmpty(request.EndTime) && TimeSpan.TryParse(request.EndTime, out var et))
            {
                endTime = et;
            }

            // Allow multiple sessions on same day (same or different times) - no duplicate check

            // Create CourseDate entry (single source of truth)
            var courseDate = new CourseDate
            {
                CourseId = request.CourseId,
                DateType = dateType,
                ScheduledDate = normalizedDate,
                StartTime = startTime,
                EndTime = endTime,
                Location = request.Location,
                MeetingLink = request.MeetingLink,
                MaxCapacity = request.MaxCapacity,
                TeacherId = request.TeacherId,
                CreatedBy = createdBy,
                IsActive = true
            };

            _context.CourseDates.Add(courseDate);
            await _context.SaveChangesAsync();

            return MapToResponseDto(courseDate, course, teacher);
        }

        public async Task<ScheduleResponseDto?> GetScheduleByIdAsync(Guid scheduleId)
        {
            var courseDate = await _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .FirstOrDefaultAsync(d => d.CourseDateId == scheduleId);

            if (courseDate == null) return null;

            return MapToResponseDto(courseDate, courseDate.Course, courseDate.Teacher);
        }

        public async Task<ScheduleListResponseDto> GetSchedulesAsync(ScheduleFilterRequestDto filter)
        {
            var query = _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .Where(d => d.IsActive)
                .AsQueryable();

            // Apply filters
            if (filter.CourseId.HasValue)
            {
                query = query.Where(d => d.CourseId == filter.CourseId.Value);
            }

            if (!string.IsNullOrEmpty(filter.EventType))
            {
                var dateType = MapEventTypeToDateType(filter.EventType);
                query = query.Where(d => d.DateType == dateType);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate >= filter.FromDate.Value.Date);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate <= filter.ToDate.Value.Date);
            }

            if (!string.IsNullOrEmpty(filter.Location))
            {
                query = query.Where(d => d.Location != null && d.Location.Contains(filter.Location));
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "eventtype" or "datetype" => filter.SortDescending
                    ? query.OrderByDescending(d => d.DateType)
                    : query.OrderBy(d => d.DateType),
                "createdat" => filter.SortDescending
                    ? query.OrderByDescending(d => d.CreatedAt)
                    : query.OrderBy(d => d.CreatedAt),
                _ => filter.SortDescending
                    ? query.OrderByDescending(d => d.ScheduledDate).ThenByDescending(d => d.StartTime)
                    : query.OrderBy(d => d.ScheduledDate).ThenBy(d => d.StartTime)
            };

            // Apply pagination
            var courseDates = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new ScheduleListResponseDto
            {
                Schedules = courseDates.Select(d => MapToResponseDto(d, d.Course, d.Teacher)).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<List<ScheduleCalendarDto>> GetSchedulesForCalendarAsync(DateTime? fromDate = null, DateTime? toDate = null, Guid? courseId = null)
        {
            var query = _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .Where(d => d.IsActive)
                .AsQueryable();

            // Only show today and future dates - never past
            var today = AustraliaSydneyTime.TodayDate;
            var effectiveFrom = fromDate.HasValue && fromDate.Value.Date > today ? fromDate.Value.Date : today;
            query = query.Where(d => d.ScheduledDate >= effectiveFrom);

            if (toDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate <= toDate.Value.Date);
            }

            if (courseId.HasValue)
            {
                query = query.Where(d => d.CourseId == courseId.Value);
            }

            var courseDates = await query
                .OrderBy(d => d.ScheduledDate)
                .ThenBy(d => d.StartTime)
                .ToListAsync();

            return courseDates.Select(d => new ScheduleCalendarDto
            {
                ScheduleId = d.CourseDateId,
                EventTitle = $"{d.DateType} - {d.Course.CourseCode}",
                EventType = MapDateTypeToEventType(d.DateType),
                CourseCode = d.Course.CourseCode,
                CourseName = d.Course.CourseName,
                ScheduledDate = d.ScheduledDate,
                StartTime = d.StartTime?.ToString(@"hh\:mm"),
                EndTime = d.EndTime?.ToString(@"hh\:mm"),
                Location = d.Location,
                MeetingLink = d.MeetingLink,
                Status = d.IsActive ? "Scheduled" : "Cancelled",
                Color = GetEventTypeColor(d.DateType),
                BgColor = GetEventTypeBgColor(d.DateType),
                TeacherId = d.TeacherId,
                TeacherName = d.Teacher?.FullName
            }).ToList();
        }

        public async Task<List<StudentScheduleCalendarDto>> GetStudentScheduleForCalendarAsync(
            Guid studentId,
            DateTime? fromDate = null,
            DateTime? toDate = null)
        {
            // Get enrollments where payment is verified and status is active
            var verifiedEnrollments = await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Category)
                .Where(e => e.StudentId == studentId
                    && e.PaymentStatus == "Verified"
                    && e.Status == "Active")
                .ToListAsync();

            if (!verifiedEnrollments.Any())
            {
                return new List<StudentScheduleCalendarDto>();
            }

            // Get course IDs from verified enrollments
            var enrolledCourseIds = verifiedEnrollments.Select(e => e.CourseId).ToList();

            // Get all course dates for enrolled courses
            var query = _context.CourseDates
                .Include(d => d.Course)
                    .ThenInclude(c => c.Category)
                .Include(d => d.Teacher)
                .Where(d => d.IsActive && enrolledCourseIds.Contains(d.CourseId))
                .AsQueryable();

            // Only show today and future dates - never past
            var today = AustraliaSydneyTime.TodayDate;
            var effectiveFrom = fromDate.HasValue && fromDate.Value.Date > today ? fromDate.Value.Date : today;
            query = query.Where(d => d.ScheduledDate >= effectiveFrom);

            if (toDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate <= toDate.Value.Date);
            }

            var courseDates = await query
                .OrderBy(d => d.ScheduledDate)
                .ThenBy(d => d.StartTime)
                .ToListAsync();

            return courseDates.Select(d =>
            {
                var enrollment = verifiedEnrollments.First(e => e.CourseId == d.CourseId);
                return new StudentScheduleCalendarDto
                {
                    ScheduleId = d.CourseDateId,
                    EnrollmentId = enrollment.EnrollmentId,
                    CourseId = d.CourseId,
                    CourseCode = d.Course.CourseCode,
                    CourseName = d.Course.CourseName,
                    CategoryName = d.Course.Category?.CategoryName,
                    EventTitle = $"{d.DateType} - {d.Course.CourseCode}",
                    EventType = MapDateTypeToEventType(d.DateType),
                    ScheduledDate = d.ScheduledDate,
                    StartTime = d.StartTime?.ToString(@"hh\:mm"),
                    EndTime = d.EndTime?.ToString(@"hh\:mm"),
                    Location = d.Location,
                    MeetingLink = d.MeetingLink,
                    Status = d.IsActive ? "Scheduled" : "Cancelled",
                    Color = GetEventTypeColor(d.DateType),
                    BgColor = GetEventTypeBgColor(d.DateType),
                    TeacherId = d.TeacherId,
                    TeacherName = d.Teacher?.FullName,
                    EnrolledAt = enrollment.EnrolledAt,
                    EnrollmentStatus = enrollment.Status
                };
            }).ToList();
        }

        public async Task<List<TeacherScheduleCalendarDto>> GetTeacherScheduleForCalendarAsync(
            Guid teacherId,
            DateTime? fromDate = null,
            DateTime? toDate = null)
        {
            var query = _context.CourseDates
                .Include(d => d.Course)
                    .ThenInclude(c => c.Category)
                .Where(d => d.IsActive && d.TeacherId == teacherId)
                .AsQueryable();

            // Only show today and future dates - never past
            var today = AustraliaSydneyTime.TodayDate;
            var effectiveFrom = fromDate.HasValue && fromDate.Value.Date > today ? fromDate.Value.Date : today;
            query = query.Where(d => d.ScheduledDate >= effectiveFrom);

            if (toDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate <= toDate.Value.Date);
            }

            var courseDates = await query
                .OrderBy(d => d.ScheduledDate)
                .ThenBy(d => d.StartTime)
                .ToListAsync();

            return courseDates.Select(d => new TeacherScheduleCalendarDto
            {
                ScheduleId = d.CourseDateId,
                CourseId = d.CourseId,
                CourseCode = d.Course.CourseCode,
                CourseName = d.Course.CourseName,
                CategoryName = d.Course.Category?.CategoryName,
                EventTitle = $"{d.DateType} - {d.Course.CourseCode}",
                EventType = MapDateTypeToEventType(d.DateType),
                ScheduledDate = d.ScheduledDate,
                StartTime = d.StartTime?.ToString(@"hh\:mm"),
                EndTime = d.EndTime?.ToString(@"hh\:mm"),
                Location = d.Location,
                MeetingLink = d.MeetingLink,
                Status = d.IsActive ? "Scheduled" : "Cancelled",
                Color = GetEventTypeColor(d.DateType),
                BgColor = GetEventTypeBgColor(d.DateType),
                EnrolledStudentsCount = d.CurrentEnrollments,
                MaxCapacity = d.MaxCapacity
            }).ToList();
        }

        public async Task<ScheduleResponseDto?> UpdateScheduleAsync(Guid scheduleId, UpdateScheduleRequestDto request)
        {
            var courseDate = await _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .FirstOrDefaultAsync(d => d.CourseDateId == scheduleId);

            if (courseDate == null) return null;

            // Update fields if provided
            if (request.CourseId.HasValue)
            {
                var course = await _context.Courses.FindAsync(request.CourseId.Value);
                if (course == null)
                    throw new ArgumentException("Course not found");
                courseDate.CourseId = request.CourseId.Value;
            }

            if (!string.IsNullOrEmpty(request.EventType))
            {
                courseDate.DateType = MapEventTypeToDateType(request.EventType);
            }

            if (request.ScheduledDate.HasValue)
            {
                courseDate.ScheduledDate = request.ScheduledDate.Value.Date;
            }

            if (!string.IsNullOrEmpty(request.StartTime) && TimeSpan.TryParse(request.StartTime, out var startTime))
            {
                courseDate.StartTime = startTime;
            }

            if (!string.IsNullOrEmpty(request.EndTime) && TimeSpan.TryParse(request.EndTime, out var endTime))
            {
                courseDate.EndTime = endTime;
            }

            if (request.Location != null)
            {
                courseDate.Location = request.Location;
            }

            if (request.MeetingLink != null)
            {
                courseDate.MeetingLink = request.MeetingLink;
            }

            if (request.MaxCapacity.HasValue)
            {
                courseDate.MaxCapacity = request.MaxCapacity;
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                courseDate.IsActive = request.Status != "Cancelled";
            }

            // Update teacher if provided (no role check - frontend already filters teachers)
            if (request.TeacherId.HasValue)
            {
                var teacher = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == request.TeacherId.Value && u.IsActive);
                
                if (teacher != null)
                {
                    courseDate.TeacherId = request.TeacherId;
                    courseDate.Teacher = teacher;
                }
            }

            await _context.SaveChangesAsync();

            // Reload to get updated navigation properties
            await _context.Entry(courseDate).Reference(d => d.Course).LoadAsync();
            await _context.Entry(courseDate).Reference(d => d.Teacher).LoadAsync();

            return MapToResponseDto(courseDate, courseDate.Course, courseDate.Teacher);
        }

        public async Task<(bool Success, bool WasDeactivated)> DeleteScheduleAsync(Guid scheduleId)
        {
            var courseDate = await _context.CourseDates.FindAsync(scheduleId);
            if (courseDate == null) return (false, false);

            // If there are enrollments, deactivate instead of delete
            if (courseDate.CurrentEnrollments > 0)
            {
                courseDate.IsActive = false;
                await _context.SaveChangesAsync();
                return (true, WasDeactivated: true);
            }

            _context.CourseDates.Remove(courseDate);
            await _context.SaveChangesAsync();
            return (true, WasDeactivated: false);
        }

        public async Task<int> DeleteOldSchedulesAsync()
        {
            var today = DateTime.Today;
            var oldSchedules = await _context.CourseDates
                .Where(d => d.ScheduledDate < today && d.CurrentEnrollments == 0)
                .ToListAsync();

            if (oldSchedules.Count == 0) return 0;

            _context.CourseDates.RemoveRange(oldSchedules);
            await _context.SaveChangesAsync();
            return oldSchedules.Count;
        }

        public async Task<bool> UpdateScheduleStatusAsync(Guid scheduleId, string status)
        {
            var courseDate = await _context.CourseDates.FindAsync(scheduleId);
            if (courseDate == null) return false;

            courseDate.IsActive = status != "Cancelled";
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Maps frontend event types to CourseDate DateType values
        /// </summary>
        private static string MapEventTypeToDateType(string eventType)
        {
            return eventType?.ToLower() switch
            {
                "theory" => "Theory",
                "practical" => "Practical",
                "exam" => "Exam",
                "meeting" or "general" => "General",
                _ => eventType ?? "General"
            };
        }

        /// <summary>
        /// Maps CourseDate DateType values to frontend event types
        /// </summary>
        private static string MapDateTypeToEventType(string dateType)
        {
            return dateType?.ToLower() switch
            {
                "theory" => "Theory",
                "practical" => "Practical",
                "exam" => "Exam",
                "general" => "General",
                _ => dateType ?? "General"
            };
        }

        private static string GetEventTypeColor(string dateType)
        {
            return dateType?.ToLower() switch
            {
                "theory" => "text-blue-700",
                "practical" => "text-purple-700",
                "exam" => "text-green-700",
                _ => "text-gray-700"
            };
        }

        private static string GetEventTypeBgColor(string dateType)
        {
            return dateType?.ToLower() switch
            {
                "theory" => "bg-blue-200",
                "practical" => "bg-purple-200",
                "exam" => "bg-green-200",
                _ => "bg-gray-200"
            };
        }

        private static ScheduleResponseDto MapToResponseDto(CourseDate courseDate, CourseEntity course, User? teacher = null)
        {
            return new ScheduleResponseDto
            {
                ScheduleId = courseDate.CourseDateId,
                CourseId = courseDate.CourseId,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                CourseDateId = courseDate.CourseDateId,
                EventTitle = $"{courseDate.DateType} - {course.CourseCode}",
                EventType = MapDateTypeToEventType(courseDate.DateType),
                ScheduledDate = courseDate.ScheduledDate,
                StartTime = courseDate.StartTime?.ToString(@"hh\:mm"),
                EndTime = courseDate.EndTime?.ToString(@"hh\:mm"),
                Location = courseDate.Location,
                MeetingLink = courseDate.MeetingLink,
                MaxCapacity = courseDate.MaxCapacity,
                CurrentEnrollments = courseDate.CurrentEnrollments,
                Status = courseDate.IsActive ? "Scheduled" : "Cancelled",
                CreatedAt = courseDate.CreatedAt,
                TeacherId = courseDate.TeacherId,
                TeacherName = teacher?.FullName,
                TeacherEmail = teacher?.Email
            };
        }
    }
}
