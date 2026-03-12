using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Requests.VOC;
using TrainingInstituteLMS.DTOs.DTOs.Responses.VOC;

namespace TrainingInstituteLMS.ApiService.Services.VOC
{
    public class VOCService : IVOCService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<VOCService> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public VOCService(TrainingLMSDbContext context, IEmailService emailService, ILogger<VOCService> logger, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<VOCSubmissionResponseDto?> SubmitVOCAsync(VOCSubmissionRequestDto request)
        {
            try
            {
                string? paymentProofPath = null;
                if (request.PaymentProof != null && request.PaymentProof.Length > 0)
                {
                    var rootPath = _webHostEnvironment.WebRootPath ?? Path.Combine(_webHostEnvironment.ContentRootPath, "wwwroot");
                    var uploadsFolder = Path.Combine(rootPath, "uploads", "voc", "payments");
                    if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = Guid.NewGuid().ToString() + "_" + request.PaymentProof.FileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.PaymentProof.CopyToAsync(fileStream);
                    }
                    paymentProofPath = "/uploads/voc/payments/" + uniqueFileName;
                }

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
                    SelectedCoursesJson = request.SelectedCourses,
                    PaymentMethod = request.PaymentMethod,
                    TotalAmount = request.TotalAmount,
                    TransactionId = request.TransactionId,
                    PaymentProofPath = paymentProofPath,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.VOCSubmissions.Add(submission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("VOC Submission created: {Email}", request.Email);

                // Send confirmation email
                await _emailService.SendVOCSubmissionConfirmationAsync(
                    request.Email,
                    request.FirstName,
                    request.LastName,
                    submission.SubmissionId.ToString(),
                    request.TotalAmount,
                    request.PaymentMethod ?? "None",
                    submission.SelectedCoursesJson);

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
                var submissionEntities = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var submissions = submissionEntities.Select(s => MapToResponse(s)).ToList();

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

        public async Task<(bool success, string error)> SendVOCEmailOTPAsync(string email)
        {
            try
            {
                var otp = new Random().Next(100000, 999999).ToString();

                // Try saving OTP to DB first
                try
                {
                    var vocOtp = new VOCEmailOTP
                    {
                        Email = email,
                        OTP = otp,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(10)
                    };
                    _context.VOCEmailOTPs.Add(vocOtp);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("VOC OTP saved to DB for {Email}", email);
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "DB error saving OTP for {Email}. Inner: {Inner}", email, dbEx.InnerException?.Message ?? "none");
                    return (false, $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
                }

                // Try sending email
                try
                {
                    await _emailService.SendEmailOTPAsync(email, otp);
                    _logger.LogInformation("VOC OTP email sent successfully to {Email}", email);
                    return (true, string.Empty);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Email error sending OTP to {Email}. Inner: {Inner}", email, emailEx.InnerException?.Message ?? "none");
                    return (false, $"Email error: {emailEx.InnerException?.Message ?? emailEx.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error sending VOC OTP to {Email}", email);
                return (false, ex.Message);
            }
        }

        public async Task<bool> VerifyVOCEmailOTPAsync(string email, string otp)
        {
            try
            {
                var vocOtp = await _context.VOCEmailOTPs
                    .Where(o => o.Email == email && o.OTP == otp && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();

                if (vocOtp == null) return false;

                vocOtp.IsUsed = true;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying VOC OTP for {Email}", email);
                return false;
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
                SelectedCoursesJson = submission.SelectedCoursesJson,
                PaymentMethod = submission.PaymentMethod,
                TotalAmount = submission.TotalAmount,
                TransactionId = submission.TransactionId,
                Status = submission.Status,
                PaymentProofPath = submission.PaymentProofPath,
                CreatedAt = submission.CreatedAt
            };
        }
    }
}
