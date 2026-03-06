using Microsoft.AspNetCore.Http;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Enrollment;

namespace TrainingInstituteLMS.ApiService.Services.Enrollment
{
    public interface IEnrollmentService
    {
        // Student Course Browsing
        Task<List<StudentBrowseCourseDto>> GetAvailableCoursesForStudentAsync(Guid studentId, string? searchQuery = null);
        Task<List<StudentEnrolledCourseDto>> GetStudentEnrolledCoursesAsync(Guid studentId);
        
        // Enrollment Operations
        Task<EnrollmentResponseDto?> CreateEnrollmentAsync(CreateEnrollmentRequestDto request, Guid studentId);
        Task<EnrollmentResponseDto?> GetEnrollmentByIdAsync(Guid enrollmentId);
        Task<EnrollmentListResponseDto> GetEnrollmentsAsync(EnrollmentFilterRequestDto filter);
        Task<bool> CancelEnrollmentAsync(Guid enrollmentId, Guid studentId);
        
        // Course Booking (Registration + Enrollment + Payment in one flow)
        Task<BookCourseResponseDto?> BookCourseAsync(BookCourseRequestDto request, IFormFile receiptFile);
        
        // Payment Operations (Student)
        Task<PaymentProofResponseDto?> SubmitPaymentProofAsync(
            SubmitPaymentProofRequestDto request, 
            IFormFile receiptFile, 
            Guid studentId);
        Task<PaymentProofResponseDto?> GetPaymentProofAsync(Guid enrollmentId);
        Task<bool> VerifyPaymentAsync(Guid paymentProofId, VerifyPaymentRequestDto request, Guid verifiedBy);
        
        // Admin Payment Operations
        Task<AdminPaymentListResponseDto> GetPaymentProofsForAdminAsync(AdminPaymentFilterRequestDto filter);
        Task<AdminPaymentProofResponseDto?> GetPaymentProofByIdForAdminAsync(Guid paymentProofId);
        Task<AdminPaymentStatsResponseDto> GetPaymentStatsAsync();
        Task<(byte[] FileBytes, string ContentType, string FileName)?> DownloadPaymentReceiptAsync(Guid paymentProofId);
        
        // Validation
        Task<bool> CanStudentEnrollAsync(Guid studentId, Guid courseId);
        Task<bool> HasStudentEnrolledInCourseAsync(Guid studentId, Guid courseId);

        // Admin Booking Dashboard
        Task<WeeklyBookingStatsDto> GetWeeklyBookingStatsAsync(DateTime weekStart);
        Task<BookingDetailsResponseDto> GetBookingDetailsByDateAsync(DateTime date, Guid? courseId = null, string? planFilter = null);
    }
}
