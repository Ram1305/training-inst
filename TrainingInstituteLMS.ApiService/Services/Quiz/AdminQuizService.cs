using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz;

namespace TrainingInstituteLMS.ApiService.Services.Quiz
{
    public class AdminQuizService : IAdminQuizService
    {
        private readonly TrainingLMSDbContext _context;

        public AdminQuizService(TrainingLMSDbContext context)
        {
            _context = context;
        }

        public async Task<AdminQuizResultListResponseDto> GetAllQuizResultsAsync(
            string? searchQuery = null,
            string? status = null,
            bool? isPassed = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int pageNumber = 1,
            int pageSize = 10)
        {
            var query = _context.PreEnrollmentQuizAttempts
                .Include(q => q.Student)
                .Include(q => q.QuizSectionResults)
                .Include(q => q.AdminBypass)
                    .ThenInclude(ab => ab != null ? ab.Admin : null)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                searchQuery = searchQuery.ToLower();
                query = query.Where(q =>
                    q.Student.FullName.ToLower().Contains(searchQuery) ||
                    q.Student.Email.ToLower().Contains(searchQuery));
            }

            // Apply passed filter
            if (isPassed.HasValue)
            {
                query = query.Where(q => q.IsPassed == isPassed.Value);
            }

            // Apply status filter
            if (!string.IsNullOrWhiteSpace(status))
            {
                switch (status.ToLower())
                {
                    case "pending":
                        query = query.Where(q => !q.IsPassed && q.AdminBypass == null && q.Status != "Rejected");
                        break;
                    case "approved":
                        query = query.Where(q => q.IsPassed || q.AdminBypass != null);
                        break;
                    case "rejected":
                        query = query.Where(q => q.Status == "Rejected");
                        break;
                }
            }

            // Apply date filters
            if (fromDate.HasValue)
            {
                query = query.Where(q => q.AttemptDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(q => q.AttemptDate <= toDate.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Get statistics
            var allResults = await _context.PreEnrollmentQuizAttempts
                .Include(q => q.AdminBypass)
                .ToListAsync();

            var passedCount = allResults.Count(q => q.IsPassed);
            var failedCount = allResults.Count(q => !q.IsPassed);
            var pendingCount = allResults.Count(q => !q.IsPassed && q.AdminBypass == null && q.Status != "Rejected");
            var approvedCount = allResults.Count(q => q.IsPassed || q.AdminBypass != null);
            var rejectedCount = allResults.Count(q => q.Status == "Rejected");

            // Apply pagination
            var results = await query
                .OrderByDescending(q => q.AttemptDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var resultDtos = results.Select(MapToAdminQuizResultResponse).ToList();

            return new AdminQuizResultListResponseDto
            {
                Results = resultDtos,
                TotalCount = totalCount,
                PassedCount = passedCount,
                FailedCount = failedCount,
                PendingCount = pendingCount,
                ApprovedCount = approvedCount,
                RejectedCount = rejectedCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        public async Task<AdminQuizResultResponseDto?> GetQuizResultByIdAsync(Guid quizAttemptId)
        {
            var result = await _context.PreEnrollmentQuizAttempts
                .Include(q => q.Student)
                .Include(q => q.QuizSectionResults)
                .Include(q => q.AdminBypass)
                    .ThenInclude(ab => ab != null ? ab.Admin : null)
                .FirstOrDefaultAsync(q => q.QuizAttemptId == quizAttemptId);

            return result == null ? null : MapToAdminQuizResultResponse(result);
        }

        public async Task<AdminBypassResponseDto?> CreateAdminBypassAsync(CreateAdminBypassRequestDto request, Guid adminUserId)
        {
            // Check if bypass already exists FIRST
            var existingBypass = await _context.AdminBypasses
                .FirstOrDefaultAsync(ab => ab.QuizAttemptId == request.QuizAttemptId && ab.IsActive);

            if (existingBypass != null)
            {
                return null; // Bypass already exists
            }

            // Check if quiz attempt exists
            var quizAttempt = await _context.PreEnrollmentQuizAttempts
                .Include(q => q.Student)
                .Include(q => q.QuizSectionResults)
                .FirstOrDefaultAsync(q => q.QuizAttemptId == request.QuizAttemptId);

            if (quizAttempt == null)
            {
                return null;
            }

            // Get admin user
            var admin = await _context.Users.FindAsync(adminUserId);
            if (admin == null)
            {
                return null;
            }

            // If the quiz was failed, randomize the results to make it pass
            if (!quizAttempt.IsPassed)
            {
                RandomizeQuizResultsToPass(quizAttempt);
                
                // Explicitly mark entities as modified for EF tracking
                _context.Entry(quizAttempt).State = EntityState.Modified;
                foreach (var section in quizAttempt.QuizSectionResults)
                {
                    _context.Entry(section).State = EntityState.Modified;
                }
            }

            // Create admin bypass
            var adminBypass = new AdminBypass
            {
                BypassId = Guid.NewGuid(),
                StudentId = request.StudentId,
                QuizAttemptId = request.QuizAttemptId,
                BypassedBy = adminUserId,
                Reason = request.Reason ?? "Approved by admin",
                BypassedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.AdminBypasses.Add(adminBypass);

            // Update quiz attempt status
            quizAttempt.Status = "Approved";

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_AdminBypasses_QuizAttemptId") == true)
            {
                // Another thread created the bypass between our check and insert
                return null;
            }

            return new AdminBypassResponseDto
            {
                BypassId = adminBypass.BypassId,
                StudentId = adminBypass.StudentId,
                StudentName = quizAttempt.Student.FullName,
                StudentEmail = quizAttempt.Student.Email,
                QuizAttemptId = adminBypass.QuizAttemptId,
                BypassedBy = adminBypass.BypassedBy,
                BypassedByName = admin.FullName,
                Reason = adminBypass.Reason,
                BypassedAt = adminBypass.BypassedAt,
                IsActive = adminBypass.IsActive
            };
        }

        public async Task<bool> RejectStudentAsync(RejectStudentRequestDto request, Guid adminUserId)
        {
            var quizAttempt = await _context.PreEnrollmentQuizAttempts
                .FirstOrDefaultAsync(q => q.QuizAttemptId == request.QuizAttemptId);

            if (quizAttempt == null)
            {
                return false;
            }

            quizAttempt.Status = "Rejected";
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<AdminBypassResponseDto?> GetAdminBypassByStudentIdAsync(Guid studentId)
        {
            var bypass = await _context.AdminBypasses
                .Include(ab => ab.Student)
                .Include(ab => ab.Admin)
                .Include(ab => ab.QuizAttempt)
                .FirstOrDefaultAsync(ab => ab.StudentId == studentId && ab.IsActive);

            return bypass == null ? null : MapToAdminBypassResponse(bypass);
        }

        public async Task<AdminBypassResponseDto?> GetAdminBypassByQuizAttemptIdAsync(Guid quizAttemptId)
        {
            var bypass = await _context.AdminBypasses
                .Include(ab => ab.Student)
                .Include(ab => ab.Admin)
                .Include(ab => ab.QuizAttempt)
                .FirstOrDefaultAsync(ab => ab.QuizAttemptId == quizAttemptId && ab.IsActive);

            return bypass == null ? null : MapToAdminBypassResponse(bypass);
        }

        public async Task<List<AdminBypassResponseDto>> GetAllAdminBypassesAsync()
        {
            var bypasses = await _context.AdminBypasses
                .Include(ab => ab.Student)
                .Include(ab => ab.Admin)
                .Include(ab => ab.QuizAttempt)
                .Where(ab => ab.IsActive)
                .OrderByDescending(ab => ab.BypassedAt)
                .ToListAsync();

            return bypasses.Select(MapToAdminBypassResponse).ToList();
        }

        public async Task<bool> RevokeAdminBypassAsync(Guid bypassId, Guid adminUserId)
        {
            var bypass = await _context.AdminBypasses
                .Include(ab => ab.QuizAttempt)
                .FirstOrDefaultAsync(ab => ab.BypassId == bypassId);

            if (bypass == null)
            {
                return false;
            }

            bypass.IsActive = false;

            // Update quiz attempt status back to pending
            if (bypass.QuizAttempt != null)
            {
                bypass.QuizAttempt.Status = "Pending";
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<QuizStatisticsResponseDto> GetQuizStatisticsAsync()
        {
            var allAttempts = await _context.PreEnrollmentQuizAttempts
                .Include(q => q.AdminBypass)
                .ToListAsync();

            var totalAttempts = allAttempts.Count;
            var passedCount = allAttempts.Count(q => q.IsPassed);
            var failedCount = allAttempts.Count(q => !q.IsPassed);
            var pendingCount = allAttempts.Count(q => !q.IsPassed && q.AdminBypass == null && q.Status != "Rejected");
            var approvedBypassCount = allAttempts.Count(q => q.AdminBypass != null && q.AdminBypass.IsActive);
            var rejectedCount = allAttempts.Count(q => q.Status == "Rejected");
            var averageScore = totalAttempts > 0 ? allAttempts.Average(q => q.OverallPercentage) : 0;
            var passRate = totalAttempts > 0 ? (decimal)passedCount / totalAttempts * 100 : 0;

            return new QuizStatisticsResponseDto
            {
                TotalAttempts = totalAttempts,
                PassedCount = passedCount,
                FailedCount = failedCount,
                PendingReviewCount = pendingCount,
                ApprovedBypassCount = approvedBypassCount,
                RejectedCount = rejectedCount,
                AverageScore = Math.Round(averageScore, 2),
                PassRate = Math.Round(passRate, 2)
            };
        }

        private static AdminQuizResultResponseDto MapToAdminQuizResultResponse(PreEnrollmentQuizAttempt attempt)
        {
            // Determine status
            string status;
            if (attempt.IsPassed || (attempt.AdminBypass != null && attempt.AdminBypass.IsActive))
            {
                status = "Approved";
            }
            else if (attempt.Status == "Rejected")
            {
                status = "Rejected";
            }
            else
            {
                status = "Pending";
            }

            return new AdminQuizResultResponseDto
            {
                QuizAttemptId = attempt.QuizAttemptId,
                StudentId = attempt.StudentId,
                StudentName = attempt.Student?.FullName ?? "Unknown",
                StudentEmail = attempt.Student?.Email ?? "Unknown",
                StudentPhone = attempt.Student?.PhoneNumber,
                AttemptDate = attempt.AttemptDate,
                TotalQuestions = attempt.TotalQuestions,
                CorrectAnswers = attempt.CorrectAnswers,
                WrongAnswers = attempt.TotalQuestions - attempt.CorrectAnswers,
                OverallPercentage = attempt.OverallPercentage,
                IsPassed = attempt.IsPassed,
                Status = status,
                CompletedAt = attempt.CompletedAt,
                HasAdminBypass = attempt.AdminBypass != null && attempt.AdminBypass.IsActive,
                AdminBypass = attempt.AdminBypass != null && attempt.AdminBypass.IsActive
                    ? new AdminBypassResponseDto
                    {
                        BypassId = attempt.AdminBypass.BypassId,
                        StudentId = attempt.AdminBypass.StudentId,
                        QuizAttemptId = attempt.AdminBypass.QuizAttemptId,
                        BypassedBy = attempt.AdminBypass.BypassedBy,
                        BypassedByName = attempt.AdminBypass.Admin?.FullName ?? "Unknown",
                        Reason = attempt.AdminBypass.Reason,
                        BypassedAt = attempt.AdminBypass.BypassedAt,
                        IsActive = attempt.AdminBypass.IsActive
                    }
                    : null,
                SectionResults = attempt.QuizSectionResults?.Select(sr => new QuizSectionResultResponseDto
                {
                    SectionResultId = sr.SectionResultId,
                    SectionName = sr.SectionName,
                    TotalQuestions = sr.TotalQuestions,
                    CorrectAnswers = sr.CorrectAnswers,
                    SectionPercentage = sr.SectionPercentage,
                    SectionPassed = sr.SectionPassed
                }).ToList() ?? new List<QuizSectionResultResponseDto>()
            };
        }

        private static AdminBypassResponseDto MapToAdminBypassResponse(AdminBypass bypass)
        {
            return new AdminBypassResponseDto
            {
                BypassId = bypass.BypassId,
                StudentId = bypass.StudentId,
                StudentName = bypass.Student?.FullName ?? "Unknown",
                StudentEmail = bypass.Student?.Email ?? "Unknown",
                QuizAttemptId = bypass.QuizAttemptId,
                BypassedBy = bypass.BypassedBy,
                BypassedByName = bypass.Admin?.FullName ?? "Unknown",
                Reason = bypass.Reason,
                BypassedAt = bypass.BypassedAt,
                IsActive = bypass.IsActive
            };
        }

        private void RandomizeQuizResultsToPass(PreEnrollmentQuizAttempt quizAttempt)
        {
            var random = new Random();
            int totalCorrect = 0;
            int totalQuestions = 0;

            // Randomize each section to be between 67% and 95%
            foreach (var section in quizAttempt.QuizSectionResults)
            {
                totalQuestions += section.TotalQuestions;
                
                // Calculate minimum correct answers needed for 67%
                int minCorrectForPass = (int)Math.Ceiling(section.TotalQuestions * 0.67m);
                
                // Calculate maximum correct answers for 95%
                int maxCorrectFor95 = (int)Math.Floor(section.TotalQuestions * 0.95m);
                
                // Ensure we have a valid range
                if (maxCorrectFor95 < minCorrectForPass)
                {
                    maxCorrectFor95 = minCorrectForPass;
                }
                
                // Randomize between 67% and 95%
                section.CorrectAnswers = random.Next(minCorrectForPass, maxCorrectFor95 + 1);
                
                // Recalculate percentage
                section.SectionPercentage = Math.Round((decimal)section.CorrectAnswers / section.TotalQuestions * 100, 2);
                section.SectionPassed = true;

                totalCorrect += section.CorrectAnswers;
            }

            // Calculate current overall percentage
            decimal currentOverallPercentage = totalQuestions > 0 
                ? Math.Round((decimal)totalCorrect / totalQuestions * 100, 2) 
                : 0;

            // Target range: 81% to 95%
            decimal targetMinPercentage = 81m;
            decimal targetMaxPercentage = 95m;

            // Adjust if needed to fit within 81-95% range
            if (currentOverallPercentage < targetMinPercentage)
            {
                // Need to increase score to reach at least 81%
                int minCorrectForOverall = (int)Math.Ceiling(totalQuestions * (targetMinPercentage / 100m));
                int additionalCorrectNeeded = minCorrectForOverall - totalCorrect;

                if (additionalCorrectNeeded > 0)
                {
                    // Distribute additional correct answers across sections
                    var sectionsToAdjust = quizAttempt.QuizSectionResults.ToList();
                    
                    while (additionalCorrectNeeded > 0 && sectionsToAdjust.Any())
                    {
                        var section = sectionsToAdjust[random.Next(sectionsToAdjust.Count)];
                        
                        // Don't exceed 95% for any section
                        int maxAllowedForSection = (int)Math.Floor(section.TotalQuestions * 0.95m);
                        
                        if (section.CorrectAnswers < maxAllowedForSection)
                        {
                            section.CorrectAnswers++;
                            additionalCorrectNeeded--;
                            totalCorrect++;
                        }
                        else
                        {
                            // Section is already at 95%, remove from adjustment pool
                            sectionsToAdjust.Remove(section);
                        }
                    }

                    // Recalculate percentages for adjusted sections
                    foreach (var section in quizAttempt.QuizSectionResults)
                    {
                        section.SectionPercentage = Math.Round((decimal)section.CorrectAnswers / section.TotalQuestions * 100, 2);
                        section.SectionPassed = true;
                    }
                }
            }
            else if (currentOverallPercentage > targetMaxPercentage)
            {
                // Need to decrease score to not exceed 95%
                int maxCorrectForOverall = (int)Math.Floor(totalQuestions * (targetMaxPercentage / 100m));
                int excessCorrect = totalCorrect - maxCorrectForOverall;

                if (excessCorrect > 0)
                {
                    // Reduce correct answers across sections
                    var sectionsToAdjust = quizAttempt.QuizSectionResults.ToList();
                    
                    while (excessCorrect > 0 && sectionsToAdjust.Any())
                    {
                        var section = sectionsToAdjust[random.Next(sectionsToAdjust.Count)];
                        
                        // Don't go below 67% for any section
                        int minAllowedForSection = (int)Math.Ceiling(section.TotalQuestions * 0.67m);
                        
                        if (section.CorrectAnswers > minAllowedForSection)
                        {
                            section.CorrectAnswers--;
                            excessCorrect--;
                            totalCorrect--;
                        }
                        else
                        {
                            // Section is already at 67%, remove from adjustment pool
                            sectionsToAdjust.Remove(section);
                        }
                    }

                    // Recalculate percentages for adjusted sections
                    foreach (var section in quizAttempt.QuizSectionResults)
                    {
                        section.SectionPercentage = Math.Round((decimal)section.CorrectAnswers / section.TotalQuestions * 100, 2);
                        section.SectionPassed = true;
                    }
                }
            }

            // Update overall quiz attempt
            quizAttempt.CorrectAnswers = totalCorrect;
            quizAttempt.TotalQuestions = totalQuestions;
            quizAttempt.OverallPercentage = totalQuestions > 0 
                ? Math.Round((decimal)totalCorrect / totalQuestions * 100, 2) 
                : 0;
            quizAttempt.IsPassed = true;
        }
    }
}
