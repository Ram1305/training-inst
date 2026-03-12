using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TrainingInstituteLMS.ApiService.Configuration;
using TrainingInstituteLMS.ApiService.Helpers;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Enrollments;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Payment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Payment;

namespace TrainingInstituteLMS.ApiService.Services.Payment
{
    public class PaymentGatewayService : IPaymentGatewayService
    {
        private readonly HttpClient _httpClient;
        private readonly EwaySettings _ewaySettings;
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<PaymentGatewayService> _logger;
        private readonly IEmailService _emailService;

        public PaymentGatewayService(
            IHttpClientFactory httpClientFactory,
            IOptions<EwaySettings> ewaySettings,
            TrainingLMSDbContext context,
            ILogger<PaymentGatewayService> logger,
            IEmailService emailService)
        {
            _httpClient = httpClientFactory.CreateClient("EwayClient");
            _ewaySettings = ewaySettings.Value;
            _context = context;
            _logger = logger;
            _emailService = emailService;

            // Configure base address and authentication
            _httpClient.BaseAddress = new Uri(_ewaySettings.GetEndpointUrl());
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_ewaySettings.ApiKey}:{_ewaySettings.Password}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<CardPaymentResultResponseDto> ProcessCardPaymentAsync(ProcessCardPaymentRequestDto request)
        {
            // Generate an 8-digit numeric invoice number
            var invoiceNumber = Random.Shared.Next(10000000, 100000000).ToString();
            var invoiceReference = $"INV-{request.CourseId.ToString()[..8]}-{DateTime.UtcNow:yyyyMMdd}";

            try
            {
                // 1. First validate the request data
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "A user with this email already exists. Please login instead.",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var course = await _context.Courses
                    .Include(c => c.Category)
                    .FirstOrDefaultAsync(c => c.CourseId == request.CourseId && c.IsActive);
                if (course == null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Course not found or inactive",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var courseDate = await _context.CourseDates
                    .FirstOrDefaultAsync(d => d.CourseDateId == request.SelectedCourseDateId
                                              && d.CourseId == request.CourseId
                                              && d.IsActive
                                              && d.ScheduledDate.Date >= DateTime.UtcNow.Date);
                if (courseDate == null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Invalid or unavailable course date selected",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                if (courseDate.MaxCapacity.HasValue && courseDate.CurrentEnrollments >= courseDate.MaxCapacity.Value)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Selected course date is fully booked",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                // 2. Process payment with eWay Direct API (no redirect/callback URLs - synchronous request/response only).
                // eWAY portal: Site URL and redirect URLs are optional; we do not send them in the API request.
                var ewayRequest = new EwayDirectPaymentRequest
                {
                    Customer = new EwayCustomer
                    {
                        FirstName = GetFirstName(request.FullName),
                        LastName = GetLastName(request.FullName),
                        Email = request.Email,
                        Phone = request.Phone,
                        Reference = request.Email,
                        CardDetails = new EwayCardDetails
                        {
                            Name = request.CardName,
                            Number = request.CardNumber,
                            ExpiryMonth = request.ExpiryMonth,
                            ExpiryYear = request.ExpiryYear,
                            CVN = request.CVV
                        }
                    },
                    Payment = new EwayPayment
                    {
                        TotalAmount = request.AmountCents,
                        InvoiceNumber = invoiceNumber,
                        InvoiceDescription = GetEwayInvoiceDescription(course.CourseDescription, course.CourseName),
                        InvoiceReference = invoiceReference,
                        CurrencyCode = request.Currency ?? "AUD"
                    },
                    TransactionType = "Purchase",
                    Method = "ProcessPayment"
                };

                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                };

                var json = JsonSerializer.Serialize(ewayRequest, jsonOptions);
                _logger.LogInformation("eWay Request: {Request}", json);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                // Call eWay Direct Payment API
                var response = await _httpClient.PostAsync("/Transaction", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("eWay API Response Status: {Status}, Body: {Response}", response.StatusCode, responseBody);

                // Probe the raw TransactionStatus type/value to aid diagnosing gateway shape differences.
                // This is intentionally best-effort and must never block payment processing.
                try
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                        doc.RootElement.TryGetProperty("TransactionStatus", out var ts))
                    {
                        _logger.LogInformation(
                            "eWay TransactionStatus raw: Kind={Kind}, Value={Value}",
                            ts.ValueKind,
                            ts.ToString());
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Unable to probe eWay TransactionStatus from response JSON.");
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("eWay API Error: {Status} - {Response}", response.StatusCode, responseBody);
                    var gatewayError = string.IsNullOrWhiteSpace(responseBody)
                        ? $"Payment gateway error ({(int)response.StatusCode} {response.StatusCode}). Please try again or contact support."
                        : $"Payment gateway error: {responseBody.Trim().TrimEnd('.')}";
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = gatewayError,
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                // Parse the eWay response with flexible number handling
                var deserializeOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };
                
                var ewayResponse = JsonSerializer.Deserialize<EwayTransactionResponse>(responseBody, deserializeOptions);

                // TransactionStatus is a boolean in the actual response
                var paymentSuccess = ewayResponse?.TransactionStatus == true;
                var responseCode = ewayResponse?.ResponseCode;
                var responseMessage = ewayResponse?.ResponseMessage; // This contains the code like "D4451", "A2000"
                var transactionId = ewayResponse?.TransactionID ?? 0;
                var authorisationCode = ewayResponse?.AuthorisationCode;

                _logger.LogInformation(
                    "Payment processed for {Email} - Transaction ID: {TransactionId}, Success: {Success}, Code: {Code}, Message: {Message}",
                    request.Email,
                    transactionId,
                    paymentSuccess,
                    responseCode,
                    responseMessage);

                if (!paymentSuccess)
                {
                    // Use responseMessage (contains codes like D4451) to get user-friendly message
                    var userFriendlyMessage = EwayResponseHelper.GetUserFriendlyMessage(responseMessage);
                    var errorDetails = ewayResponse?.Errors != null && ewayResponse.Errors.Count > 0 
                        ? string.Join(", ", ewayResponse.Errors) 
                        : null;

                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        TransactionId = transactionId,
                        ResponseCode = responseCode,
                        ResponseMessage = userFriendlyMessage,
                        ErrorMessages = errorDetails ?? userFriendlyMessage,
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                // 3. Payment successful - Create user, student, and enrollment
                var enrollmentResult = await CreateEnrollmentAfterPaymentAsync(
                    request,
                    course,
                    courseDate,
                    transactionId,
                    invoiceNumber);

                // 4. Send enrollment confirmation email to student
                try
                {
                    await _emailService.SendEnrollmentConfirmationAsync(
                        request.Email,
                        request.FullName,
                        request.Email,
                        request.Phone ?? string.Empty,
                        null,
                        course.CourseName,
                        course.CourseCode ?? string.Empty,
                        courseDate.ScheduledDate,
                        courseDate.StartTime,
                        courseDate.EndTime,
                        courseDate.Location,
                        invoiceNumber,
                        DateTime.UtcNow,
                        request.AmountCents / 100m,
                        "Credit Card",
                        request.Email,
                        request.Password);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send enrollment confirmation email to {Email}", request.Email);
                }

                return new CardPaymentResultResponseDto
                {
                    Success = true,
                    TransactionId = transactionId,
                    ResponseCode = responseCode,
                    ResponseMessage = "Payment successful!",
                    AuthorisationCode = authorisationCode,
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber,
                    UserId = enrollmentResult.UserId,
                    StudentId = enrollmentResult.StudentId,
                    EnrollmentId = enrollmentResult.EnrollmentId,
                    StudentName = request.FullName,
                    Email = request.Email,
                    CourseName = course.CourseName,
                    CourseCode = course.CourseCode,
                    SelectedDate = courseDate.ScheduledDate,
                    PaymentStatus = "Verified",
                    EnrollmentStatus = "Active",
                    BookedAt = DateTime.UtcNow
                };
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "JSON parsing error processing card payment for {Email}", request.Email);

                return new CardPaymentResultResponseDto
                {
                    Success = false,
                    ErrorMessages = $"Payment gateway response error: {jsonEx.Message}",
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing card payment for {Email}", request.Email);

                return new CardPaymentResultResponseDto
                {
                    Success = false,
                    ErrorMessages = ex.Message,
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber
                };
            }
        }

        public async Task<CardPaymentResultResponseDto> ProcessCardPaymentExistingStudentAsync(ProcessCardPaymentExistingStudentRequestDto request)
        {
            // Generate an 8-digit numeric invoice number
            var invoiceNumber = Random.Shared.Next(10000000, 100000000).ToString();
            var invoiceReference = $"INV-{request.CourseId.ToString()[..8]}-{DateTime.UtcNow:yyyyMMdd}";

            try
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == request.StudentId && s.IsActive);
                if (student == null || student.User == null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Student not found or inactive",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var course = await _context.Courses
                    .Include(c => c.Category)
                    .FirstOrDefaultAsync(c => c.CourseId == request.CourseId && c.IsActive);
                if (course == null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Course not found or inactive",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var courseDate = await _context.CourseDates
                    .FirstOrDefaultAsync(d => d.CourseDateId == request.SelectedCourseDateId
                                              && d.CourseId == request.CourseId
                                              && d.IsActive
                                              && d.ScheduledDate.Date >= DateTime.UtcNow.Date);
                if (courseDate == null)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Invalid or unavailable course date selected",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                if (courseDate.MaxCapacity.HasValue && courseDate.CurrentEnrollments >= courseDate.MaxCapacity.Value)
                {
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = "Selected course date is fully booked",
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var fullName = student.FullName ?? student.User.FullName ?? "Student";
                var email = student.Email ?? student.User.Email ?? "";
                var phone = student.PhoneNumber ?? student.User.PhoneNumber ?? "";

                var ewayRequest = new EwayDirectPaymentRequest
                {
                    Customer = new EwayCustomer
                    {
                        FirstName = GetFirstName(fullName),
                        LastName = GetLastName(fullName),
                        Email = email,
                        Phone = phone,
                        Reference = email,
                        CardDetails = new EwayCardDetails
                        {
                            Name = request.CardName,
                            Number = request.CardNumber,
                            ExpiryMonth = request.ExpiryMonth,
                            ExpiryYear = request.ExpiryYear,
                            CVN = request.CVV
                        }
                    },
                    Payment = new EwayPayment
                    {
                        TotalAmount = request.AmountCents,
                        InvoiceNumber = invoiceNumber,
                        InvoiceDescription = GetEwayInvoiceDescription(course.CourseDescription, course.CourseName),
                        InvoiceReference = invoiceReference,
                        CurrencyCode = request.Currency ?? "AUD"
                    },
                    TransactionType = "Purchase",
                    Method = "ProcessPayment"
                };

                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                };

                var json = JsonSerializer.Serialize(ewayRequest, jsonOptions);
                _logger.LogInformation("eWay Request (existing student): {Request}", json);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("/Transaction", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("eWay API Response Status: {Status}, Body: {Response}", response.StatusCode, responseBody);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("eWay API Error: {Status} - {Response}", response.StatusCode, responseBody);
                    var gatewayError = string.IsNullOrWhiteSpace(responseBody)
                        ? $"Payment gateway error ({(int)response.StatusCode} {response.StatusCode}). Please try again or contact support."
                        : $"Payment gateway error: {responseBody.Trim().TrimEnd('.')}";
                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        ErrorMessages = gatewayError,
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var deserializeOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };
                var ewayResponse = JsonSerializer.Deserialize<EwayTransactionResponse>(responseBody, deserializeOptions);

                var paymentSuccess = ewayResponse?.TransactionStatus == true;
                var responseCode = ewayResponse?.ResponseCode;
                var responseMessage = ewayResponse?.ResponseMessage;
                var transactionId = ewayResponse?.TransactionID ?? 0;
                var authorisationCode = ewayResponse?.AuthorisationCode;

                _logger.LogInformation(
                    "Payment processed for existing student {StudentId} - Transaction ID: {TransactionId}, Success: {Success}",
                    request.StudentId, transactionId, paymentSuccess);

                if (!paymentSuccess)
                {
                    var userFriendlyMessage = EwayResponseHelper.GetUserFriendlyMessage(responseMessage);
                    var errorDetails = ewayResponse?.Errors != null && ewayResponse.Errors.Count > 0
                        ? string.Join(", ", ewayResponse.Errors)
                        : null;

                    return new CardPaymentResultResponseDto
                    {
                        Success = false,
                        TransactionId = transactionId,
                        ResponseCode = responseCode,
                        ResponseMessage = userFriendlyMessage,
                        ErrorMessages = errorDetails ?? userFriendlyMessage,
                        AmountPaidCents = request.AmountCents,
                        InvoiceNumber = invoiceNumber
                    };
                }

                var enrollmentId = await CreateEnrollmentForExistingStudentAsync(
                    request.StudentId,
                    student,
                    request.CourseId,
                    request.SelectedCourseDateId,
                    request.AmountCents,
                    course,
                    courseDate,
                    transactionId,
                    invoiceNumber);

                try
                {
                    await _emailService.SendEnrollmentConfirmationAsync(
                        email,
                        fullName,
                        email,
                        phone ?? string.Empty,
                        null,
                        course.CourseName,
                        course.CourseCode ?? string.Empty,
                        courseDate.ScheduledDate,
                        courseDate.StartTime,
                        courseDate.EndTime,
                        courseDate.Location,
                        invoiceNumber,
                        DateTime.UtcNow,
                        request.AmountCents / 100m,
                        "Credit Card",
                        string.Empty,
                        string.Empty);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send enrollment confirmation email to {Email}", email);
                }

                return new CardPaymentResultResponseDto
                {
                    Success = true,
                    TransactionId = transactionId,
                    ResponseCode = responseCode,
                    ResponseMessage = "Payment successful!",
                    AuthorisationCode = authorisationCode,
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber,
                    UserId = student.UserId,
                    StudentId = student.StudentId,
                    EnrollmentId = enrollmentId,
                    StudentName = fullName,
                    Email = email,
                    CourseName = course.CourseName,
                    CourseCode = course.CourseCode,
                    SelectedDate = courseDate.ScheduledDate,
                    PaymentStatus = "Verified",
                    EnrollmentStatus = "Active",
                    BookedAt = DateTime.UtcNow
                };
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "JSON parsing error processing card payment for existing student {StudentId}", request.StudentId);
                return new CardPaymentResultResponseDto
                {
                    Success = false,
                    ErrorMessages = $"Payment gateway response error: {jsonEx.Message}",
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing card payment for existing student {StudentId}", request.StudentId);
                return new CardPaymentResultResponseDto
                {
                    Success = false,
                    ErrorMessages = ex.Message,
                    AmountPaidCents = request.AmountCents,
                    InvoiceNumber = invoiceNumber
                };
            }
        }

        private async Task<Guid> CreateEnrollmentForExistingStudentAsync(
            Guid studentId,
            Student student,
            Guid courseId,
            Guid selectedCourseDateId,
            int amountCents,
            Data.Entities.Courses.Course course,
            Data.Entities.Courses.CourseDate courseDate,
            long transactionId,
            string invoiceNumber)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var dbTransaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var enrollment = new Data.Entities.Enrollments.Enrollment
                    {
                        EnrollmentId = Guid.NewGuid(),
                        StudentId = studentId,
                        CourseId = courseId,
                        QuizAttemptId = null,
                        SelectedExamDateId = selectedCourseDateId,
                        AmountPaid = amountCents / 100m,
                        PaymentStatus = "Verified",
                        IsAdminBypassed = false,
                        QuizCompleted = false,
                        Status = "Active",
                        EnrolledAt = DateTime.UtcNow,
                        PaymentVerifiedAt = DateTime.UtcNow
                    };
                    _context.Enrollments.Add(enrollment);

                    var paymentProof = new PaymentProof
                    {
                        PaymentProofId = Guid.NewGuid(),
                        EnrollmentId = enrollment.EnrollmentId,
                        StudentId = studentId,
                        ReceiptFileUrl = $"card-payment-{transactionId}",
                        TransactionId = transactionId.ToString(),
                        AmountPaid = amountCents / 100m,
                        PaymentDate = DateTime.UtcNow,
                        PaymentMethod = "Credit Card",
                        BankName = "eWay Payment Gateway",
                        ReferenceNumber = invoiceNumber,
                        UploadedAt = DateTime.UtcNow,
                        Status = "Verified",
                        VerifiedAt = DateTime.UtcNow
                    };
                    _context.PaymentProofs.Add(paymentProof);

                    courseDate.CurrentEnrollments++;
                    course.EnrolledStudentsCount++;

                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();

                    _logger.LogInformation(
                        "Created enrollment for existing student {StudentId} - EnrollmentId: {EnrollmentId}",
                        studentId, enrollment.EnrollmentId);

                    return enrollment.EnrollmentId;
                }
                catch
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            });
        }

        private async Task<(Guid UserId, Guid StudentId, Guid EnrollmentId)> CreateEnrollmentAfterPaymentAsync(
            ProcessCardPaymentRequestDto request,
            Data.Entities.Courses.Course course,
            Data.Entities.Courses.CourseDate courseDate,
            long transactionId,
            string invoiceNumber)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var dbTransaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // 1. Create User
                    var user = new User
                    {
                        UserId = Guid.NewGuid(),
                        FullName = request.FullName,
                        Email = request.Email,
                        PhoneNumber = request.Phone,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        LastLoginAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);

                    // 2. Get or create the Student role
                    var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
                    if (studentRole == null)
                    {
                        studentRole = new Role
                        {
                            RoleId = Guid.NewGuid(),
                            RoleName = "Student",
                            Description = "Student role"
                        };
                        _context.Roles.Add(studentRole);
                    }

                    // 3. Assign Student role to user
                    var userRole = new UserRole
                    {
                        UserRoleId = Guid.NewGuid(),
                        UserId = user.UserId,
                        RoleId = studentRole.RoleId,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.UserRoles.Add(userRole);

                    // 4. Create Student record
                    var student = new Student
                    {
                        StudentId = Guid.NewGuid(),
                        UserId = user.UserId,
                        FullName = request.FullName,
                        Email = request.Email,
                        PhoneNumber = request.Phone,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Students.Add(student);

                    // 5. Create Enrollment - Already paid via card
                    var enrollment = new Data.Entities.Enrollments.Enrollment
                    {
                        EnrollmentId = Guid.NewGuid(),
                        StudentId = student.StudentId,
                        CourseId = request.CourseId,
                        QuizAttemptId = null,
                        SelectedExamDateId = request.SelectedCourseDateId,
                        AmountPaid = request.AmountCents / 100m,
                        PaymentStatus = "Verified", // Already verified via card payment
                        IsAdminBypassed = false,
                        QuizCompleted = false,
                        Status = "Active",
                        EnrolledAt = DateTime.UtcNow,
                        PaymentVerifiedAt = DateTime.UtcNow
                    };
                    _context.Enrollments.Add(enrollment);

                    // 6. Create Payment Proof record (for tracking purposes)
                    var paymentProof = new PaymentProof
                    {
                        PaymentProofId = Guid.NewGuid(),
                        EnrollmentId = enrollment.EnrollmentId,
                        StudentId = student.StudentId,
                        ReceiptFileUrl = $"card-payment-{transactionId}", // No file, but track the transaction
                        TransactionId = transactionId.ToString(),
                        AmountPaid = request.AmountCents / 100m,
                        PaymentDate = DateTime.UtcNow,
                        PaymentMethod = "Credit Card",
                        BankName = "eWay Payment Gateway",
                        ReferenceNumber = invoiceNumber,
                        UploadedAt = DateTime.UtcNow,
                        Status = "Verified",
                        VerifiedAt = DateTime.UtcNow
                    };
                    _context.PaymentProofs.Add(paymentProof);

                    // 7. Update course date enrollment count
                    courseDate.CurrentEnrollments++;

                    // 8. Update course enrollment count
                    course.EnrolledStudentsCount++;

                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();

                    _logger.LogInformation(
                        "Created enrollment for {Email} - UserId: {UserId}, StudentId: {StudentId}, EnrollmentId: {EnrollmentId}",
                        request.Email, user.UserId, student.StudentId, enrollment.EnrollmentId);

                    return (user.UserId, student.StudentId, enrollment.EnrollmentId);
                }
                catch
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            });
        }

        private static string GetFirstName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return "";
            var parts = fullName.Split(' ', 2);
            return parts[0];
        }

        private static string GetLastName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return "";
            var parts = fullName.Split(' ', 2);
            return parts.Length == 2 ? parts[1] : "";
        }

        /// <summary>
        /// Builds a plain-text invoice description for eWay: max 60 chars, letters/digits/spaces only.
        /// Uses course description when present, otherwise course name. Email content is unchanged.
        /// </summary>
        private static string GetEwayInvoiceDescription(string? courseDescription, string courseName)
        {
            var source = !string.IsNullOrWhiteSpace(courseDescription) ? courseDescription : courseName;
            var sanitized = Regex.Replace(source, @"[^a-zA-Z0-9 ]", "");
            sanitized = Regex.Replace(sanitized, @"\s+", " ").Trim();
            if (sanitized.Length == 0) return "Course booking";
            return sanitized.Length <= 60 ? sanitized : sanitized[..60];
        }
    }

    #region eWay API Models

    internal class EwayDirectPaymentRequest
    {
        public EwayCustomer Customer { get; set; } = new();
        public EwayPayment Payment { get; set; } = new();
        public string TransactionType { get; set; } = "Purchase";
        public string Method { get; set; } = "ProcessPayment";
    }

    internal class EwayCustomer
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Reference { get; set; }
        public EwayCardDetails CardDetails { get; set; } = new();
    }

    internal class EwayCardDetails
    {
        public string? Name { get; set; }
        public string? Number { get; set; }
        public string? ExpiryMonth { get; set; }
        public string? ExpiryYear { get; set; }
        public string? CVN { get; set; }
    }

    internal class EwayPayment
    {
        public int TotalAmount { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? InvoiceDescription { get; set; }
        public string? InvoiceReference { get; set; }
        public string CurrencyCode { get; set; } = "AUD";
    }

    /// <summary>
    /// Converts eWay TransactionID from number, string, decimal, or null to a nullable long.
    /// eWay can return TransactionID as null for some failure responses.
    /// </summary>
    internal sealed class JsonNullableLongFlexibleConverter : JsonConverter<long?>
    {
        public override long? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;

            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt64(out var l)) return l;
                if (reader.TryGetDecimal(out var d)) return (long)d;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var s = reader.GetString();
                if (string.IsNullOrWhiteSpace(s)) return null;
                if (long.TryParse(s, out var parsed)) return parsed;
            }

            throw new JsonException($"Cannot convert to Int64. TokenType: {reader.TokenType}");
        }

        public override void Write(Utf8JsonWriter writer, long? value, JsonSerializerOptions options)
        {
            if (value.HasValue) writer.WriteNumberValue(value.Value);
            else writer.WriteNullValue();
        }
    }

    /// <summary>
    /// Converts eWay TransactionStatus from boolean, string ("true"/"false"), number (1/0), or null.
    /// </summary>
    internal sealed class JsonBoolFlexibleConverter : JsonConverter<bool>
    {
        public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.True: return true;
                case JsonTokenType.False: return false;
                case JsonTokenType.Null: return false;
                case JsonTokenType.Number:
                    if (reader.TryGetInt64(out var n)) return n != 0;
                    if (reader.TryGetDecimal(out var d)) return d != 0;
                    return false;
                case JsonTokenType.String:
                    var s = reader.GetString()?.Trim();
                    if (string.IsNullOrEmpty(s)) return false;
                    if (bool.TryParse(s, out var b)) return b;
                    if (s == "1" || string.Equals(s, "yes", StringComparison.OrdinalIgnoreCase)) return true;
                    if (s == "0" || string.Equals(s, "no", StringComparison.OrdinalIgnoreCase)) return false;
                    return false;
                default:
                    throw new JsonException($"Cannot convert to Boolean. TokenType: {reader.TokenType}");
            }
        }

        public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options) => writer.WriteBooleanValue(value);
    }

    /// <summary>
    /// Converts eWay Errors from array of strings, single string, array of objects, object, or null to List&lt;string&gt;?.
    /// </summary>
    internal sealed class JsonListOfStringFlexibleConverter : JsonConverter<List<string>?>
    {
        public override List<string>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;

            if (reader.TokenType == JsonTokenType.String)
            {
                var s = reader.GetString();
                return string.IsNullOrWhiteSpace(s) ? null : new List<string> { s };
            }

            if (reader.TokenType == JsonTokenType.StartArray)
            {
                var list = new List<string>();
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndArray) return list;
                    list.Add(ReadOneElement(ref reader));
                }
                return list;
            }

            if (reader.TokenType == JsonTokenType.StartObject)
            {
                // Single object: use JsonDocument to get a string representation or common keys
                using var doc = JsonDocument.ParseValue(ref reader);
                var str = doc.RootElement.GetRawText();
                return new List<string> { str };
            }

            // Number or other: treat as single message
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt64(out var n)) return new List<string> { n.ToString() };
                if (reader.TryGetDecimal(out var d)) return new List<string> { d.ToString() };
            }
            return new List<string> { "" };
        }

        private static string ReadOneElement(ref Utf8JsonReader reader)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.String: return reader.GetString() ?? "";
                case JsonTokenType.Number:
                    if (reader.TryGetInt64(out var n)) return n.ToString();
                    if (reader.TryGetDecimal(out var d)) return d.ToString();
                    return "";
                case JsonTokenType.True: return "true";
                case JsonTokenType.False: return "false";
                case JsonTokenType.Null: return "";
                case JsonTokenType.StartObject:
                    using (var doc = JsonDocument.ParseValue(ref reader))
                        return doc.RootElement.GetRawText();
                case JsonTokenType.StartArray:
                    using (var doc = JsonDocument.ParseValue(ref reader))
                        return doc.RootElement.GetRawText();
                default: return "";
            }
        }

        public override void Write(Utf8JsonWriter writer, List<string>? value, JsonSerializerOptions options)
        {
            if (value == null) writer.WriteNullValue();
            else { writer.WriteStartArray(); foreach (var s in value) writer.WriteStringValue(s); writer.WriteEndArray(); }
        }
    }

    /// <summary>
    /// eWay Transaction Response - matches actual API response structure
    /// Example response:
    /// {"AuthorisationCode":"390243","ResponseCode":"00","ResponseMessage":"A2000","TransactionID":42505775,"TransactionStatus":true,...}
    /// Note: ResponseMessage contains the response code (like D4451, A2000) - this is used for lookup
    /// </summary>
    internal class EwayTransactionResponse
    {
        public string? AuthorisationCode { get; set; }
        public string? ResponseCode { get; set; }
        
        /// <summary>
        /// ResponseMessage contains the actual response code like "A2000", "D4451" etc.
        /// This is used to look up user-friendly messages
        /// </summary>
        public string? ResponseMessage { get; set; }
        
        /// <summary>
        /// TransactionID - eWay may return as number, string, decimal, or null
        /// </summary>
        [JsonConverter(typeof(JsonNullableLongFlexibleConverter))]
        public long? TransactionID { get; set; }
        
        /// <summary>
        /// TransactionStatus - eWay may return as boolean, string, number, or null.
        /// Some error responses can also return unexpected types. We capture the raw JSON and interpret it safely.
        /// </summary>
        [JsonPropertyName("TransactionStatus")]
        public JsonElement TransactionStatusRaw { get; set; }

        [JsonIgnore]
        public bool TransactionStatus => EwayJsonValue.ToBool(TransactionStatusRaw);
        
        public string? TransactionType { get; set; }
        
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public decimal? BeagleScore { get; set; }
        
        public EwayVerification? Verification { get; set; }
        public EwayCustomerResponse? Customer { get; set; }
        public EwayPaymentResponse? Payment { get; set; }

        /// <summary>
        /// Errors - eWay may return as string, array of strings, array of objects, or null.
        /// </summary>
        [JsonConverter(typeof(JsonListOfStringFlexibleConverter))]
        public List<string>? Errors { get; set; }
    }

    internal static class EwayJsonValue
    {
        public static bool ToBool(JsonElement el)
        {
            switch (el.ValueKind)
            {
                case JsonValueKind.True: return true;
                case JsonValueKind.False: return false;
                case JsonValueKind.Null:
                case JsonValueKind.Undefined:
                    return false;
                case JsonValueKind.Number:
                    if (el.TryGetInt64(out var n)) return n != 0;
                    if (el.TryGetDecimal(out var d)) return d != 0;
                    return false;
                case JsonValueKind.String:
                    var s = el.GetString()?.Trim();
                    if (string.IsNullOrEmpty(s)) return false;
                    if (bool.TryParse(s, out var b)) return b;

                    // Common numeric/string truthy/falsey encodings
                    if (s == "1" || string.Equals(s, "yes", StringComparison.OrdinalIgnoreCase) || string.Equals(s, "y", StringComparison.OrdinalIgnoreCase))
                        return true;
                    if (s == "0" || string.Equals(s, "no", StringComparison.OrdinalIgnoreCase) || string.Equals(s, "n", StringComparison.OrdinalIgnoreCase))
                        return false;

                    // Some gateways send status words instead of booleans.
                    if (string.Equals(s, "success", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(s, "successful", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(s, "approved", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(s, "completed", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(s, "ok", StringComparison.OrdinalIgnoreCase))
                        return true;

                    return false;
                default:
                    // Objects/arrays or other unexpected types should not be considered successful.
                    return false;
            }
        }
    }

    internal class EwayVerification
    {
        public int CVN { get; set; }
        public int Address { get; set; }
        public int Email { get; set; }
        public int Mobile { get; set; }
        public int Phone { get; set; }
    }

    internal class EwayCustomerResponse
    {
        public EwayCardDetailsResponse? CardDetails { get; set; }
        public string? TokenCustomerID { get; set; }
        public string? Reference { get; set; }
        public string? Title { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? CompanyName { get; set; }
        public string? JobDescription { get; set; }
        public string? Street1 { get; set; }
        public string? Street2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Mobile { get; set; }
        public string? Comments { get; set; }
        public string? Fax { get; set; }
        public string? Url { get; set; }
    }

    internal class EwayCardDetailsResponse
    {
        public string? Number { get; set; }
        public string? Name { get; set; }
        public string? ExpiryMonth { get; set; }
        public string? ExpiryYear { get; set; }
        public string? StartMonth { get; set; }
        public string? StartYear { get; set; }
        public string? IssueNumber { get; set; }
    }

    internal class EwayPaymentResponse
    {
        public int TotalAmount { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? InvoiceDescription { get; set; }
        public string? InvoiceReference { get; set; }
        public string? CurrencyCode { get; set; }
    }

    #endregion
}
