using TrainingInstituteLMS.DTOs.DTOs.Requests.Student;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Student;

namespace TrainingInstituteLMS.ApiService.Services.StudentManagement
{
    public interface IStudentManagementService
    {
        Task<StudentListResponseDto> GetAllStudentsAsync(StudentFilterRequestDto filter);
        Task<StudentResponseDto?> GetStudentByIdAsync(Guid studentId);
        Task<StudentResponseDto?> GetStudentByUserIdAsync(Guid userId);
        Task<StudentResponseDto?> CreateStudentAsync(CreateStudentRequestDto request, Guid? createdBy = null);
        Task<StudentResponseDto?> UpdateStudentAsync(Guid studentId, UpdateStudentRequestDto request);
        Task<bool> DeleteStudentAsync(Guid studentId);
        Task<bool> ToggleStudentStatusAsync(Guid studentId);
        Task<StudentStatsResponseDto> GetStudentStatsAsync();
    }
}
