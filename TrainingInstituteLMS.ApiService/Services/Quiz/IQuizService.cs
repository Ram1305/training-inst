using TrainingInstituteLMS.DTOs.DTOs.Requests.Quiz;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Quiz;

namespace TrainingInstituteLMS.ApiService.Services.Quiz
{
    public interface IQuizService
    {
        Task<QuizSubmissionResultDto> SubmitQuizAsync(SubmitQuizRequestDto request);
        Task<GuestQuizSubmissionResultDto> SubmitGuestQuizAsync(SubmitGuestQuizRequestDto request);
        Task<QuizAttemptResponseDto?> GetQuizAttemptByIdAsync(Guid quizAttemptId);
        Task<QuizAttemptListResponseDto> GetQuizAttemptsAsync(GetQuizAttemptsRequestDto filter);
        Task<StudentQuizStatusResponseDto> GetStudentQuizStatusAsync(Guid studentId);
        Task<QuizAttemptResponseDto?> GetLatestQuizAttemptByStudentAsync(Guid studentId);
        Task<bool> HasStudentPassedQuizAsync(Guid studentId);
        Task<bool> CanStudentEnrollAsync(Guid studentId);
    }
}
