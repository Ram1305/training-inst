using TrainingInstituteLMS.DTOs.DTOs.Requests.Auth;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Auth;

namespace TrainingInstituteLMS.ApiService.Services.Auth
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginRequestDto request);
        Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto request);
        Task<bool> EmailExistsAsync(string email);
        Task<AuthResponseDto?> GetUserByIdAsync(Guid userId);
    }
}
