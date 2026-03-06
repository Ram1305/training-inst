using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Requests.CourseDate;
using TrainingInstituteLMS.DTOs.DTOs.Responses.CourseDate;
using CourseEntity = TrainingInstituteLMS.Data.Entities.Courses.Course;

namespace TrainingInstituteLMS.ApiService.Services.Course.CourseDate
{
    public class CourseDateService : ICourseDateService
    {
        private readonly TrainingLMSDbContext _context;

        public CourseDateService(TrainingLMSDbContext context)
        {
            _context = context;
        }

        public async Task<CourseDateResponseDto> CreateCourseDateAsync(CreateCourseDateRequestDto request, Guid? createdBy = null)
        {
            // Validate course exists
            var course = await _context.Courses.FindAsync(request.CourseId);
            if (course == null)
            {
                throw new ArgumentException("Course not found");
            }

            // Validate teacher if provided (no role check - frontend already filters teachers)
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

            // Normalize the scheduled date to remove time component and timezone issues
            var normalizedDate = request.ScheduledDate.Date;

            // Allow multiple sessions on same day (same or different times) - no duplicate check

            var courseDate = new Data.Entities.Courses.CourseDate
            {
                CourseId = request.CourseId,
                DateType = request.DateType,
                ScheduledDate = normalizedDate,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Location = request.Location ?? course.Location,
                MeetingLink = request.MeetingLink,
                MaxCapacity = request.MaxCapacity,
                TeacherId = request.TeacherId,
                CreatedBy = createdBy
            };

            _context.CourseDates.Add(courseDate);
            await _context.SaveChangesAsync();

            return MapToResponseDto(courseDate, course, teacher);
        }

        public async Task<CourseDateResponseDto?> GetCourseDateByIdAsync(Guid courseDateId)
        {
            var courseDate = await _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .FirstOrDefaultAsync(d => d.CourseDateId == courseDateId);

            if (courseDate == null) return null;

            return MapToResponseDto(courseDate, courseDate.Course, courseDate.Teacher);
        }

        public async Task<CourseDateListResponseDto> GetCourseDatesAsync(CourseDateFilterRequestDto filter)
        {
            var query = _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .AsQueryable();

            // Apply filters
            if (filter.CourseId.HasValue)
            {
                query = query.Where(d => d.CourseId == filter.CourseId.Value);
            }

            if (!string.IsNullOrEmpty(filter.DateType))
            {
                query = query.Where(d => d.DateType == filter.DateType);
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(d => d.ScheduledDate <= filter.ToDate.Value);
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(d => d.IsActive == filter.IsActive.Value);
            }

            if (filter.HasAvailability.HasValue && filter.HasAvailability.Value)
            {
                query = query.Where(d => !d.MaxCapacity.HasValue || d.CurrentEnrollments < d.MaxCapacity.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "datetype" => filter.SortDescending
                    ? query.OrderByDescending(d => d.DateType)
                    : query.OrderBy(d => d.DateType),
                "createdat" => filter.SortDescending
                    ? query.OrderByDescending(d => d.CreatedAt)
                    : query.OrderBy(d => d.CreatedAt),
                _ => filter.SortDescending
                    ? query.OrderByDescending(d => d.ScheduledDate)
                    : query.OrderBy(d => d.ScheduledDate)
            };

            // Apply pagination
            var courseDates = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new CourseDateListResponseDto
            {
                CourseDates = courseDates.Select(d => MapToResponseDto(d, d.Course, d.Teacher)).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<List<CourseDateSimpleDto>> GetCourseDatesForCourseAsync(Guid courseId, bool activeOnly = true, DateTime? fromDate = null)
        {
            // Use fromDate (user's local today) when provided; otherwise fall back to UTC today
            // Always filter out past dates - compare date parts only to avoid timezone edge cases
            var minDate = (fromDate?.Date ?? DateTime.UtcNow.Date);
            var query = _context.CourseDates
                .Where(d => d.CourseId == courseId)
                .Where(d => d.ScheduledDate.Date >= minDate); // Only today and future - no past dates

            if (activeOnly)
            {
                query = query.Where(d => d.IsActive);
            }

            var dates = await query
                .OrderBy(d => d.ScheduledDate)
                .ThenBy(d => d.StartTime)
                .ToListAsync();

            return dates.Select(d => new CourseDateSimpleDto
            {
                CourseDateId = d.CourseDateId,
                ScheduledDate = d.ScheduledDate,
                DateType = d.DateType,
                StartTime = d.StartTime?.ToString(@"hh\:mm"),
                EndTime = d.EndTime?.ToString(@"hh\:mm"),
                Location = d.Location,
                MeetingLink = d.MeetingLink,
                AvailableSpots = d.MaxCapacity.HasValue ? d.MaxCapacity.Value - d.CurrentEnrollments : int.MaxValue,
                CurrentEnrollments = d.CurrentEnrollments,
                IsAvailable = d.IsActive && (!d.MaxCapacity.HasValue || d.CurrentEnrollments < d.MaxCapacity.Value)
            }).ToList();
        }

        public async Task<CourseDateResponseDto?> UpdateCourseDateAsync(Guid courseDateId, UpdateCourseDateRequestDto request)
        {
            var courseDate = await _context.CourseDates
                .Include(d => d.Course)
                .Include(d => d.Teacher)
                .FirstOrDefaultAsync(d => d.CourseDateId == courseDateId);

            if (courseDate == null) return null;

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.DateType))
                courseDate.DateType = request.DateType;

            if (request.ScheduledDate.HasValue)
                courseDate.ScheduledDate = request.ScheduledDate.Value.Date; // Normalize to date only

            if (request.StartTime.HasValue)
                courseDate.StartTime = request.StartTime;

            if (request.EndTime.HasValue)
                courseDate.EndTime = request.EndTime;

            if (request.Location != null)
                courseDate.Location = request.Location;

            if (request.MeetingLink != null)
                courseDate.MeetingLink = request.MeetingLink;

            if (request.MaxCapacity.HasValue)
                courseDate.MaxCapacity = request.MaxCapacity;

            if (request.IsActive.HasValue)
                courseDate.IsActive = request.IsActive.Value;

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

            return MapToResponseDto(courseDate, courseDate.Course, courseDate.Teacher);
        }

        public async Task<(bool Success, bool WasDeactivated)> DeleteCourseDateAsync(Guid courseDateId)
        {
            var courseDate = await _context.CourseDates.FindAsync(courseDateId);
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

        public async Task<bool> ToggleCourseDateStatusAsync(Guid courseDateId)
        {
            var courseDate = await _context.CourseDates.FindAsync(courseDateId);
            if (courseDate == null) return false;

            courseDate.IsActive = !courseDate.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> BulkCreateCourseDatesAsync(Guid courseId, List<DateTime> dates, string dateType = "General", Guid? createdBy = null)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return false;

            // Allow multiple sessions per day - add all dates without filtering out existing
            var newDates = dates
                .Select(d => d.Date) // Normalize to date only
                .Select(d => new Data.Entities.Courses.CourseDate
                {
                    CourseId = courseId,
                    DateType = dateType,
                    ScheduledDate = d,
                    Location = course.Location,
                    CreatedBy = createdBy
                })
                .ToList();

            if (newDates.Any())
            {
                _context.CourseDates.AddRange(newDates);
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> BulkDeleteCourseDatesAsync(Guid courseId, List<Guid> courseDateIds)
        {
            var datesToDelete = await _context.CourseDates
                .Where(d => d.CourseId == courseId && courseDateIds.Contains(d.CourseDateId) && d.CurrentEnrollments == 0)
                .ToListAsync();

            if (!datesToDelete.Any()) return false;

            _context.CourseDates.RemoveRange(datesToDelete);
            await _context.SaveChangesAsync();
            return true;
        }

        private static CourseDateResponseDto MapToResponseDto(Data.Entities.Courses.CourseDate courseDate, CourseEntity course, User? teacher = null)
        {
            return new CourseDateResponseDto
            {
                CourseDateId = courseDate.CourseDateId,
                CourseId = courseDate.CourseId,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                DateType = courseDate.DateType,
                ScheduledDate = courseDate.ScheduledDate,
                StartTime = courseDate.StartTime?.ToString(@"hh\:mm"),
                EndTime = courseDate.EndTime?.ToString(@"hh\:mm"),
                Location = courseDate.Location,
                MeetingLink = courseDate.MeetingLink,
                MaxCapacity = courseDate.MaxCapacity,
                CurrentEnrollments = courseDate.CurrentEnrollments,
                AvailableSpots = courseDate.MaxCapacity.HasValue
                    ? courseDate.MaxCapacity.Value - courseDate.CurrentEnrollments
                    : int.MaxValue,
                IsActive = courseDate.IsActive,
                CreatedAt = courseDate.CreatedAt,
                TeacherId = courseDate.TeacherId,
                TeacherName = teacher?.FullName,
                TeacherEmail = teacher?.Email
            };
        }
    }
}
