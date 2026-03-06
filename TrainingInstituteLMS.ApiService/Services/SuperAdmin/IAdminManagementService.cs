using TrainingInstituteLMS.DTOs.DTOs.Requests.SuperAdmin;
using TrainingInstituteLMS.DTOs.DTOs.Responses.SuperAdmin;

namespace TrainingInstituteLMS.ApiService.Services.SuperAdmin
{
    public interface IAdminManagementService
    {
        Task<AdminListResponseDto> GetAllAdminsAsync(AdminFilterRequestDto filter);
        Task<AdminResponseDto?> GetAdminByIdAsync(Guid userId);
        Task<AdminResponseDto?> CreateAdminAsync(CreateAdminRequestDto request, Guid? createdBy = null);
        Task<AdminResponseDto?> UpdateAdminAsync(Guid userId, UpdateAdminRequestDto request);
        Task<bool> DeleteAdminAsync(Guid userId);
        Task<bool> ToggleAdminStatusAsync(Guid userId);
        Task<AdminStatsResponseDto> GetAdminStatsAsync();
    }
}
