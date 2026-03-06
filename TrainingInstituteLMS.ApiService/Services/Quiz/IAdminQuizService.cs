using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz;

namespace TrainingInstituteLMS.ApiService.Services.Quiz
{
    public interface IAdminQuizService
    {
        // Quiz Results Management
        Task<AdminQuizResultListResponseDto> GetAllQuizResultsAsync(
            string? searchQuery = null,
            string? status = null,
            bool? isPassed = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int pageNumber = 1,
            int pageSize = 10);

        Task<AdminQuizResultResponseDto?> GetQuizResultByIdAsync(Guid quizAttemptId);

        // Admin Bypass Management
        Task<AdminBypassResponseDto?> CreateAdminBypassAsync(CreateAdminBypassRequestDto request, Guid adminUserId);
        Task<bool> RejectStudentAsync(RejectStudentRequestDto request, Guid adminUserId);
        Task<AdminBypassResponseDto?> GetAdminBypassByStudentIdAsync(Guid studentId);
        Task<AdminBypassResponseDto?> GetAdminBypassByQuizAttemptIdAsync(Guid quizAttemptId);
        Task<List<AdminBypassResponseDto>> GetAllAdminBypassesAsync();
        Task<bool> RevokeAdminBypassAsync(Guid bypassId, Guid adminUserId);

        // Statistics
        Task<QuizStatisticsResponseDto> GetQuizStatisticsAsync();
    }
}
