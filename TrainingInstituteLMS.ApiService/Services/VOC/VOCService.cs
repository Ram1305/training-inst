using Microsoft.EntityFrameworkCore;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Requests.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Responses.VOC;

namespace TrainingInstituteLMS.ApiService.Services.VOC
{
    public class VOCService : IVOCService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<VOCService> _logger;

        public VOCService(TrainingLMSDbContext context, ILogger<VOCService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<VOCSubmissionResponseDto?> SubmitVOCAsync(VOCSubmissionRequestDto request)
        {
            try
            {
                var submission = new VOCSubmission
                {
                    SubmissionId = Guid.NewGuid(),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    AustralianStudentId = request.AustralianStudentId,
                    Email = request.Email,
                    Phone = request.Phone,
                    StreetAddress = request.StreetAddress,
                    City = request.City,
                    State = request.State,
                    Postcode = request.Postcode,
                    PreferredStartDate = request.PreferredStartDate,
                    PreferredTime = request.PreferredTime,
                    Comments = request.Comments,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.VOCSubmissions.Add(submission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("VOC Submission created: {Email}", request.Email);

                return MapToResponse(submission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting VOC: {Email}", request.Email);
                throw;
            }
        }

        public async Task<VOCListResponseDto> GetAllVOCSubmissionsAsync(int pageNumber, int pageSize, string? searchQuery, string? status)
        {
            try
            {
                var query = _context.VOCSubmissions.AsNoTracking();

                if (!string.IsNullOrWhiteSpace(searchQuery))
                {
                    var lowerQuery = searchQuery.ToLower();
                    query = query.Where(s => 
                        s.FirstName.ToLower().Contains(lowerQuery) || 
                        s.LastName.ToLower().Contains(lowerQuery) || 
                        s.Email.ToLower().Contains(lowerQuery) || 
                        s.AustralianStudentId.ToLower().Contains(lowerQuery));
                }

                if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
                {
                    query = query.Where(s => s.Status.ToLower() == status.ToLower());
                }

                var totalCount = await query.CountAsync();
                var submissions = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => MapToResponse(s))
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                return new VOCListResponseDto
                {
                    Submissions = submissions,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving VOC submissions");
                throw;
            }
        }

        public async Task<VOCSubmissionResponseDto?> GetVOCSubmissionByIdAsync(Guid submissionId)
        {
            try
            {
                var submission = await _context.VOCSubmissions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);

                return submission == null ? null : MapToResponse(submission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving VOC submission: {Id}", submissionId);
                throw;
            }
        }

        public async Task<VOCSubmissionResponseDto?> UpdateVOCStatusAsync(Guid submissionId, string status)
        {
            try
            {
                var submission = await _context.VOCSubmissions.FindAsync(submissionId);
                if (submission == null) return null;

                submission.Status = status;
                await _context.SaveChangesAsync();

                _logger.LogInformation("VOC Submission status updated: {Id} to {Status}", submissionId, status);

                return MapToResponse(submission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating VOC status: {Id}", submissionId);
                throw;
            }
        }

        public async Task<bool> DeleteVOCSubmissionAsync(Guid submissionId)
        {
            try
            {
                var submission = await _context.VOCSubmissions.FindAsync(submissionId);
                if (submission == null) return false;

                _context.VOCSubmissions.Remove(submission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("VOC Submission deleted: {Id}", submissionId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting VOC submission: {Id}", submissionId);
                throw;
            }
        }

        public async Task<VOCStatsResponseDto> GetVOCStatsAsync()
        {
            try
            {
                var stats = new VOCStatsResponseDto
                {
                    TotalSubmissions = await _context.VOCSubmissions.CountAsync(),
                    PendingSubmissions = await _context.VOCSubmissions.CountAsync(s => s.Status == "Pending"),
                    VerifiedSubmissions = await _context.VOCSubmissions.CountAsync(s => s.Status == "Verified"),
                    CompletedSubmissions = await _context.VOCSubmissions.CountAsync(s => s.Status == "Completed"),
                    RejectedSubmissions = await _context.VOCSubmissions.CountAsync(s => s.Status == "Rejected")
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving VOC stats");
                throw;
            }
        }

        private static VOCSubmissionResponseDto MapToResponse(VOCSubmission submission)
        {
            return new VOCSubmissionResponseDto
            {
                SubmissionId = submission.SubmissionId,
                FirstName = submission.FirstName,
                LastName = submission.LastName,
                AustralianStudentId = submission.AustralianStudentId,
                Email = submission.Email,
                Phone = submission.Phone,
                StreetAddress = submission.StreetAddress,
                City = submission.City,
                State = submission.State,
                Postcode = submission.Postcode,
                PreferredStartDate = submission.PreferredStartDate,
                PreferredTime = submission.PreferredTime,
                Comments = submission.Comments,
                Status = submission.Status,
                CreatedAt = submission.CreatedAt
            };
        }
    }
}
