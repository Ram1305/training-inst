using Microsoft.AspNetCore.Mvc;
using TrainingInstituteLMS.ApiService.Services.Enrollment;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Enrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Common;

namespace TrainingInstituteLMS.ApiService.Controllers.Enrollment
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        /// <summary>
        /// Book a course with registration and payment (for new users)
        /// </summary>
        [HttpPost("book")]
        public async Task<IActionResult> BookCourse(
            [FromForm] string fullName,
            [FromForm] string email,
            [FromForm] string phone,
            [FromForm] string password,
            [FromForm] Guid courseId,
            [FromForm] Guid selectedCourseDateId,
            [FromForm] string transactionId,
            [FromForm] decimal amountPaid,
            IFormFile receiptFile,
            [FromForm] DateTime? paymentDate = null,
            [FromForm] string? paymentMethod = null,
            [FromForm] string? bankName = null,
            [FromForm] string? referenceNumber = null)
        {
            try
            {
                if (receiptFile == null || receiptFile.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Receipt file is required"
                    });
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) ||
                    string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(password) ||
                    string.IsNullOrWhiteSpace(transactionId))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "All required fields must be provided"
                    });
                }

                var request = new BookCourseRequestDto
                {
                    FullName = fullName,
                    Email = email,
                    Phone = phone,
                    Password = password,
                    CourseId = courseId,
                    SelectedCourseDateId = selectedCourseDateId,
                    TransactionId = transactionId,
                    AmountPaid = amountPaid,
                    PaymentDate = paymentDate,
                    PaymentMethod = paymentMethod,
                    BankName = bankName,
                    ReferenceNumber = referenceNumber
                };

                var result = await _enrollmentService.BookCourseAsync(request, receiptFile);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to book course"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Course booked successfully! Your payment is pending verification.",
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get available courses for a student to browse (excludes already enrolled courses)
        /// </summary>
        [HttpGet("browse/{studentId:guid}")]
        public async Task<IActionResult> GetAvailableCourses(Guid studentId, [FromQuery] string? search = null)
        {
            try
            {
                var result = await _enrollmentService.GetAvailableCoursesForStudentAsync(studentId, search);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Available courses retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get a student's enrolled courses
        /// </summary>
        [HttpGet("student/{studentId:guid}")]
        public async Task<IActionResult> GetStudentEnrollments(Guid studentId)
        {
            try
            {
                var result = await _enrollmentService.GetStudentEnrolledCoursesAsync(studentId);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Enrolled courses retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Create a new enrollment
        /// </summary>
        [HttpPost("{studentId:guid}")]
        public async Task<IActionResult> CreateEnrollment(Guid studentId, [FromBody] CreateEnrollmentRequestDto request)
        {
            try
            {
                var result = await _enrollmentService.CreateEnrollmentAsync(request, studentId);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to create enrollment"
                    });
                }

                return CreatedAtAction(nameof(GetEnrollmentById), new { enrollmentId = result.EnrollmentId }, new ApiResponse<object>
                {
                    Success = true,
                    Message = "Enrollment created successfully. Please submit payment proof.",
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get enrollment by ID
        /// </summary>
        [HttpGet("{enrollmentId:guid}")]
        public async Task<IActionResult> GetEnrollmentById(Guid enrollmentId)
        {
            try
            {
                var result = await _enrollmentService.GetEnrollmentByIdAsync(enrollmentId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Enrollment retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get all enrollments with filtering (Admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEnrollments([FromQuery] EnrollmentFilterRequestDto filter)
        {
            try
            {
                var result = await _enrollmentService.GetEnrollmentsAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Enrollments retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get weekly booking stats (counts per day based on CourseDate.ScheduledDate)
        /// </summary>
        [HttpGet("booking-stats/weekly")]
        public async Task<IActionResult> GetWeeklyBookingStats([FromQuery] DateTime? weekStart = null)
        {
            try
            {
                var start = weekStart ?? GetStartOfWeek(DateTime.UtcNow);
                var result = await _enrollmentService.GetWeeklyBookingStatsAsync(start);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Weekly booking stats retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get booking details for a specific date with optional course and plan filters
        /// </summary>
        [HttpGet("booking-details")]
        public async Task<IActionResult> GetBookingDetails(
            [FromQuery] DateTime date,
            [FromQuery] Guid? courseId = null,
            [FromQuery] string? planFilter = null)
        {
            try
            {
                var result = await _enrollmentService.GetBookingDetailsByDateAsync(date.Date, courseId, planFilter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Booking details retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        private static DateTime GetStartOfWeek(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff).Date;
        }

        /// <summary>
        /// Cancel an enrollment (before payment)
        /// </summary>
        [HttpDelete("{enrollmentId:guid}/student/{studentId:guid}")]
        public async Task<IActionResult> CancelEnrollment(Guid enrollmentId, Guid studentId)
        {
            try
            {
                var result = await _enrollmentService.CancelEnrollmentAsync(enrollmentId, studentId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Enrollment cancelled successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Submit payment proof for an enrollment
        /// </summary>
        [HttpPost("{enrollmentId:guid}/payment/{studentId:guid}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> SubmitPaymentProof(
            Guid enrollmentId,
            Guid studentId,
            [FromForm] string transactionId,
            [FromForm] decimal amountPaid,
            IFormFile receiptFile,
            [FromForm] DateTime? paymentDate = null,
            [FromForm] string? paymentMethod = null,
            [FromForm] string? bankName = null,
            [FromForm] string? referenceNumber = null)
        {
            try
            {
                if (receiptFile == null || receiptFile.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Receipt file is required"
                    });
                }

                var request = new SubmitPaymentProofRequestDto
                {
                    EnrollmentId = enrollmentId,
                    TransactionId = transactionId,
                    AmountPaid = amountPaid,
                    PaymentDate = paymentDate,
                    PaymentMethod = paymentMethod,
                    BankName = bankName,
                    ReferenceNumber = referenceNumber
                };

                var result = await _enrollmentService.SubmitPaymentProofAsync(request, receiptFile, studentId);

                if (result == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to submit payment proof"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment proof submitted successfully. Awaiting verification.",
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get payment proof for an enrollment
        /// </summary>
        [HttpGet("{enrollmentId:guid}/payment")]
        public async Task<IActionResult> GetPaymentProof(Guid enrollmentId)
        {
            try
            {
                var result = await _enrollmentService.GetPaymentProofAsync(enrollmentId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Payment proof not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment proof retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Verify payment proof (Admin only)
        /// </summary>
        [HttpPut("payment/{paymentProofId:guid}/verify")]
        public async Task<IActionResult> VerifyPayment(
            Guid paymentProofId,
            [FromBody] VerifyPaymentRequestDto request,
            [FromQuery] Guid adminId)
        {
            try
            {
                var result = await _enrollmentService.VerifyPaymentAsync(paymentProofId, request, adminId);

                if (!result)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Payment proof not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = request.Approve
                        ? "Payment verified successfully"
                        : "Payment rejected"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Check if a student can enroll in a course
        /// </summary>
        [HttpGet("can-enroll/{studentId:guid}/{courseId:guid}")]
        public async Task<IActionResult> CanEnroll(Guid studentId, Guid courseId)
        {
            try
            {
                var canEnroll = await _enrollmentService.CanStudentEnrollAsync(studentId, courseId);
                var alreadyEnrolled = await _enrollmentService.HasStudentEnrolledInCourseAsync(studentId, courseId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = canEnroll ? "Student can enroll" : "Student cannot enroll",
                    Data = new
                    {
                        CanEnroll = canEnroll,
                        AlreadyEnrolled = alreadyEnrolled
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        #region Admin Payment Management

        /// <summary>
        /// Get all payment proofs for admin review with filtering
        /// </summary>
        [HttpGet("admin/payments")]
        public async Task<IActionResult> GetPaymentProofsForAdmin([FromQuery] AdminPaymentFilterRequestDto filter)
        {
            try
            {
                var result = await _enrollmentService.GetPaymentProofsForAdminAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment proofs retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get a single payment proof by ID for admin review
        /// </summary>
        [HttpGet("admin/payments/{paymentProofId:guid}")]
        public async Task<IActionResult> GetPaymentProofByIdForAdmin(Guid paymentProofId)
        {
            try
            {
                var result = await _enrollmentService.GetPaymentProofByIdForAdminAsync(paymentProofId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Payment proof not found"
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment proof retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get payment statistics for admin dashboard
        /// </summary>
        [HttpGet("admin/payments/stats")]
        public async Task<IActionResult> GetPaymentStats()
        {
            try
            {
                var result = await _enrollmentService.GetPaymentStatsAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Payment statistics retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Download payment receipt file
        /// </summary>
        [HttpGet("admin/payments/{paymentProofId:guid}/download")]
        public async Task<IActionResult> DownloadPaymentReceipt(Guid paymentProofId)
        {
            try
            {
                var result = await _enrollmentService.DownloadPaymentReceiptAsync(paymentProofId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Payment receipt not found"
                    });
                }

                var (fileBytes, contentType, fileName) = result.Value;
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }

        #endregion
    }
}
