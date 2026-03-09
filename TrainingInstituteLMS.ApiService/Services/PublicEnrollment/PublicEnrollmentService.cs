using Microsoft.EntityFrameworkCore;
using QRCoder;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.ApiService.Services.SiteSettings;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Auth;
using TrainingInstituteLMS.Data.Entities.Companies;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.Data.Entities.Students;
using TrainingInstituteLMS.DTOs.DTOs.Requests.PublicEnrollment;
using TrainingInstituteLMS.DTOs.DTOs.Responses.PublicEnrollment;
using EnrollmentEntity = TrainingInstituteLMS.Data.Entities.Enrollments.Enrollment;
using EnrollmentLinkEntity = TrainingInstituteLMS.Data.Entities.Enrollments.EnrollmentLink;
using CompanyOrderEntity = TrainingInstituteLMS.Data.Entities.Enrollments.CompanyOrder;

namespace TrainingInstituteLMS.ApiService.Services.PublicEnrollment
{
    public class PublicEnrollmentService : IPublicEnrollmentService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly ILogger<PublicEnrollmentService> _logger;
        private readonly ISiteSettingsService _siteSettingsService;
        private readonly IEmailService _emailService;
        private readonly IFileStorageService _fileStorageService;

        public PublicEnrollmentService(
            TrainingLMSDbContext context,
            ILogger<PublicEnrollmentService> logger,
            ISiteSettingsService siteSettingsService,
            IEmailService emailService,
            IFileStorageService fileStorageService)
        {
            _context = context;
            _logger = logger;
            _siteSettingsService = siteSettingsService;
            _emailService = emailService;
            _fileStorageService = fileStorageService;
        }

        /// <summary>
        /// Gets the frontend base URL for enrollment links and QR codes (from SiteSettings collection, then config, then default).
        /// </summary>
        private Task<string> GetFrontendBaseUrlAsync() => _siteSettingsService.GetEnrollmentBaseUrlAsync();

        public async Task<List<CourseDropdownItemDto>> GetCoursesForDropdownAsync()
        {
            var items = await _context.Courses
                .Where(c => c.IsActive)
                .Include(c => c.Category)
                .Select(c => new
                {
                    c.CourseId,
                    c.CourseCode,
                    c.CourseName,
                    c.Price,
                    c.Duration,
                    c.ImageUrl,
                    CategoryName = c.Category != null ? c.Category.CategoryName : null
                })
                .OrderBy(c => c.CourseName)
                .ToListAsync();

            return items.Select(c => new CourseDropdownItemDto
            {
                CourseId = c.CourseId,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Price = c.Price,
                Duration = c.Duration,
                CategoryName = c.CategoryName,
                ImageUrl = GetImageFullUrl(c.ImageUrl)
            }).ToList();
        }

        private string? GetImageFullUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            if (imageUrl.StartsWith("http://") || imageUrl.StartsWith("https://"))
                return imageUrl;

            return _fileStorageService.GetFileUrl(imageUrl);
        }

        public async Task<List<CourseDateDropdownItemDto>> GetCourseDatesAsync(Guid courseId)
        {
            var today = DateTime.UtcNow.Date;
            
            return await _context.CourseDates
                .Where(cd => cd.CourseId == courseId && cd.IsActive && cd.ScheduledDate >= today)
                .Select(cd => new CourseDateDropdownItemDto
                {
                    CourseDateId = cd.CourseDateId,
                    StartDate = cd.ScheduledDate,
                    EndDate = cd.ScheduledDate,
                    Location = cd.Location,
                    AvailableSlots = (cd.MaxCapacity ?? 30) - cd.CurrentEnrollments,
                    MaxCapacity = cd.MaxCapacity ?? 30,
                    IsAvailable = cd.CurrentEnrollments < (cd.MaxCapacity ?? 30)
                })
                .OrderBy(cd => cd.StartDate)
                .ToListAsync();
        }

        public async Task<PublicRegistrationResponseDto> RegisterUserAsync(PublicRegistrationRequestDto request)
        {
            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("An account with this email already exists");
            }

            // Create user
            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);

            // Create student
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

            await _context.Students.AddAsync(student);

            // Assign student role
            var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
            if (studentRole != null)
            {
                await _context.UserRoles.AddAsync(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = studentRole.RoleId,
                    AssignedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return new PublicRegistrationResponseDto
            {
                UserId = user.UserId.ToString(),
                StudentId = student.StudentId.ToString(),
                Email = user.Email,
                FullName = user.FullName,
                Token = "" // Token would be generated by auth service
            };
        }

        public async Task<PublicCourseEnrollmentResponseDto> EnrollInCourseAsync(PublicCourseEnrollmentRequestDto request)
        {
            var student = await _context.Students.FindAsync(request.StudentId);
            if (student == null)
            {
                throw new InvalidOperationException("Student not found");
            }

            var courseDate = await _context.CourseDates
                .Include(cd => cd.Course)
                .FirstOrDefaultAsync(cd => cd.CourseDateId == request.CourseDateId);

            if (courseDate == null)
            {
                throw new InvalidOperationException("Course date not found");
            }

            if (courseDate.CurrentEnrollments >= (courseDate.MaxCapacity ?? 30))
            {
                throw new InvalidOperationException("This course date is fully booked");
            }

            // Create enrollment
            var enrollment = new EnrollmentEntity
            {
                EnrollmentId = Guid.NewGuid(),
                StudentId = request.StudentId,
                CourseId = request.CourseId,
                CourseDateId = request.CourseDateId,
                Status = "Pending",
                PaymentStatus = request.PaymentMethod == "cash" ? "Pending" : "Awaiting",
                EnrolledAt = DateTime.UtcNow
            };

            await _context.Enrollments.AddAsync(enrollment);

            // Update course date enrollment count
            courseDate.CurrentEnrollments++;

            await _context.SaveChangesAsync();

            return new PublicCourseEnrollmentResponseDto
            {
                EnrollmentId = enrollment.EnrollmentId.ToString(),
                CourseId = request.CourseId.ToString(),
                CourseDateId = request.CourseDateId.ToString(),
                Status = enrollment.Status
            };
        }

        public async Task<EnrollmentLinkResponseDto> CreateEnrollmentLinkAsync(CreateEnrollmentLinkRequestDto request, Guid createdBy)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
                throw new InvalidOperationException("Name is required");

            // When CourseDateId is provided, validate it belongs to the Course
            if (request.CourseDateId.HasValue && request.CourseId.HasValue)
            {
                var courseDateExists = await _context.CourseDates
                    .AnyAsync(cd => cd.CourseDateId == request.CourseDateId.Value && cd.CourseId == request.CourseId.Value);
                if (!courseDateExists)
                    throw new InvalidOperationException("The selected course date does not belong to the selected course");
            }
            else if (request.CourseDateId.HasValue && !request.CourseId.HasValue)
            {
                throw new InvalidOperationException("Course must be selected when a course date is specified");
            }

            var uniqueCode = GenerateUniqueCode();
            var baseUrl = await GetFrontendBaseUrlAsync();
            var fullUrl = $"{baseUrl.TrimEnd('/')}/enroll/{uniqueCode}";

            var link = new EnrollmentLinkEntity
            {
                LinkId = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                UniqueCode = uniqueCode,
                CourseId = request.CourseId,
                CourseDateId = request.CourseDateId,
                ExpiresAt = request.ExpiresAt,
                MaxUses = request.MaxUses,
                QrCodeData = GenerateQRCode(fullUrl),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy
            };

            try
            {
                await _context.EnrollmentLinks.AddAsync(link);
                await _context.SaveChangesAsync();
                await _siteSettingsService.SetEnrollmentLinkAllowPayLaterAsync(link.LinkId, request.AllowPayLater);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "CreateEnrollmentLink database error. Name: {Name}, CourseId: {CourseId}", request.Name, request.CourseId);
                var inner = dbEx.InnerException?.Message ?? dbEx.Message;
                throw new InvalidOperationException(
                    "Database update failed. Ensure all migrations have been applied. Details: " + inner, dbEx);
            }

            return await MapToResponseDto(link, request.AllowPayLater);
        }

        public async Task<EnrollmentLinkListResponseDto> GetEnrollmentLinksAsync(int page, int pageSize)
        {
            var query = _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .OrderByDescending(l => l.CreatedAt);

            var totalCount = await query.CountAsync();
            var links = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var allowPayLaterDict = await _siteSettingsService.GetEnrollmentLinkAllowPayLaterBatchAsync(links.Select(l => l.LinkId));
            var linkDtos = new List<EnrollmentLinkResponseDto>();
            foreach (var link in links)
            {
                linkDtos.Add(await MapToResponseDto(link, allowPayLaterDict.GetValueOrDefault(link.LinkId, false)));
            }

            return new EnrollmentLinkListResponseDto
            {
                Links = linkDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<EnrollmentLinkResponseDto?> GetEnrollmentLinkAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .FirstOrDefaultAsync(l => l.LinkId == linkId);

            if (link == null) return null;
            var allowPayLater = await _siteSettingsService.GetEnrollmentLinkAllowPayLaterAsync(link.LinkId);
            return await MapToResponseDto(link, allowPayLater);
        }

        public async Task<EnrollmentLinkDataDto?> GetEnrollmentLinkByCodeAsync(string code)
        {
            var link = await _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .FirstOrDefaultAsync(l => l.UniqueCode == code && l.IsActive);

            if (link == null) return null;

            // Check expiration
            if (link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
            {
                return null;
            }

            // Check max uses
            if (link.MaxUses.HasValue && link.UsedCount >= link.MaxUses.Value)
            {
                return null;
            }

            var allowPayLater = await _siteSettingsService.GetEnrollmentLinkAllowPayLaterAsync(link.LinkId);
            return new EnrollmentLinkDataDto
            {
                LinkId = link.LinkId.ToString(),
                CourseId = link.CourseId?.ToString(),
                CourseName = link.Course?.CourseName,
                CourseDateId = link.CourseDateId?.ToString(),
                CourseDateRange = link.CourseDate != null 
                    ? $"{link.CourseDate.ScheduledDate:dd/MM/yyyy}"
                    : null,
                IsOneTimeLink = link.MaxUses == 1,
                AllowPayLater = allowPayLater
            };
        }

        public async Task<bool> ToggleLinkStatusAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return false;

            link.IsActive = !link.IsActive;
            link.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteEnrollmentLinkAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return false;

            _context.EnrollmentLinks.Remove(link);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> RegenerateQRCodeAsync(Guid linkId)
        {
            var link = await _context.EnrollmentLinks.FindAsync(linkId);
            if (link == null) return null;

            var baseUrl = await GetFrontendBaseUrlAsync();
            var fullUrl = $"{baseUrl}/enroll/{link.UniqueCode}";

            link.QrCodeData = GenerateQRCode(fullUrl);
            link.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return link.QrCodeData;
        }

        public async Task<CompanyOrderResponseDto> CreateCompanyOrderAsync(CompanyOrderRequestDto request)
        {
            if (request == null)
                throw new InvalidOperationException("Request is required");

            if (string.IsNullOrWhiteSpace(request.CompanyName))
                throw new InvalidOperationException("Company name is required");
            if (string.IsNullOrWhiteSpace(request.CompanyEmail))
                throw new InvalidOperationException("Company email is required");
            if (request.Items == null || request.Items.Count == 0)
                throw new InvalidOperationException("At least one course is required for a company order");

            try
            {
                Guid? companyId = null;
                var accountCreated = false;
                var companyPassword = string.IsNullOrWhiteSpace(request.Password) ? "123456" : request.Password;

                var companyEmail = request.CompanyEmail.Trim();
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == companyEmail);
                if (existingUser != null)
                {
                    var existingCompany = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == existingUser.UserId);
                    if (existingCompany != null)
                    {
                        companyId = existingCompany.CompanyId;
                    }
                    else
                    {
                        // Enrolled account must be in Companies collection: create Company for existing user
                        var company = new Company
                        {
                            CompanyId = Guid.NewGuid(),
                            UserId = existingUser.UserId,
                            CompanyName = request.CompanyName.Trim(),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        await _context.Companies.AddAsync(company);
                        companyId = company.CompanyId;
                    }
                }
                else
                {
                    var user = new User
                    {
                        UserId = Guid.NewGuid(),
                        FullName = request.CompanyName.Trim(),
                        Email = companyEmail,
                        PhoneNumber = request.CompanyMobile?.Trim(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(companyPassword),
                        UserType = "Company",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _context.Users.AddAsync(user);

                    var company = new Company
                    {
                        CompanyId = Guid.NewGuid(),
                        UserId = user.UserId,
                        CompanyName = request.CompanyName.Trim(),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _context.Companies.AddAsync(company);
                    companyId = company.CompanyId;

                    var companyRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Company");
                    if (companyRole != null)
                    {
                        await _context.UserRoles.AddAsync(new UserRole
                        {
                            UserRoleId = Guid.NewGuid(),
                            UserId = user.UserId,
                            RoleId = companyRole.RoleId,
                            AssignedAt = DateTime.UtcNow
                        });
                    }
                    accountCreated = true;
                }

                var order = new CompanyOrderEntity
                {
                    OrderId = Guid.NewGuid(),
                    CompanyId = companyId,
                    CompanyEmail = request.CompanyEmail.Trim(),
                    CompanyName = request.CompanyName.Trim(),
                    CompanyMobile = request.CompanyMobile?.Trim(),
                    TotalAmount = request.Items.Sum(i => i.Price),
                    PaymentMethod = request.PaymentMethod ?? "pay_later",
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.CompanyOrders.AddAsync(order);

                var baseUrl = await GetFrontendBaseUrlAsync();
                var links = new List<CompanyOrderLinkDto>();

                foreach (var item in request.Items)
                {
                    var uniqueCode = GenerateUniqueCode();
                    var fullUrl = $"{baseUrl}/enroll/{uniqueCode}";

                    var course = await _context.Courses.FindAsync(item.CourseId);
                    var courseName = course?.CourseName ?? "Course";

                    var link = new EnrollmentLinkEntity
                    {
                        LinkId = Guid.NewGuid(),
                        Name = $"Company order {order.OrderId:N} - {courseName}",
                        Description = $"One-time link for {request.CompanyName.Trim()}",
                        UniqueCode = uniqueCode,
                        CourseId = item.CourseId,
                        CourseDateId = item.CourseDateId,
                        CompanyOrderId = order.OrderId,
                        MaxUses = 1,
                        UsedCount = 0,
                        QrCodeData = GenerateQRCode(fullUrl),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _context.EnrollmentLinks.AddAsync(link);
                    links.Add(new CompanyOrderLinkDto
                    {
                        LinkId = link.LinkId.ToString(),
                        FullUrl = fullUrl,
                        CourseName = courseName
                    });
                }

                await _context.SaveChangesAsync();

                foreach (var link in await _context.EnrollmentLinks.Where(l => l.CompanyOrderId == order.OrderId).ToListAsync())
                    await _siteSettingsService.SetEnrollmentLinkAllowPayLaterAsync(link.LinkId, false);

                try
                {
                    await _emailService.SendCompanyOrderConfirmationAsync(
                        request.CompanyEmail.Trim(),
                        request.CompanyName.Trim(),
                        order.OrderId.ToString(),
                        order.TotalAmount,
                        links.Select(l => (l.CourseName, l.FullUrl)).ToList(),
                        accountCreated,
                        baseUrl);
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send company order confirmation email to {Email}. Order {OrderId} was created successfully.", request.CompanyEmail, order.OrderId);
                }

                return new CompanyOrderResponseDto
                {
                    OrderId = order.OrderId.ToString(),
                    CompanyEmail = order.CompanyEmail,
                    TotalAmount = order.TotalAmount,
                    Links = links
                };
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "CreateCompanyOrder database error. Company: {Company}, Email: {Email}", request.CompanyName, request.CompanyEmail);
                var inner = dbEx.InnerException?.Message ?? dbEx.Message;
                throw new InvalidOperationException(
                    "Database update failed. If this persists, ensure all migrations have been applied to the database. Details: " + inner, dbEx);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateCompanyOrder failed. Company: {Company}, Email: {Email}", request.CompanyName, request.CompanyEmail);
                throw;
            }
        }

        /// <summary>
        /// Process company order card payment. Returns a transaction ID for the order.
        /// Integrate with your payment gateway here; this stub returns a reference for the flow.
        /// </summary>
        public Task<CompanyCardPaymentResponseDto> ProcessCompanyCardPaymentAsync(CompanyCardPaymentRequestDto request)
        {
            if (request == null)
                throw new InvalidOperationException("Payment request is required");
            // Stub: return a transaction reference. Replace with actual gateway call when integrated.
            var transactionId = "card-" + Guid.NewGuid().ToString("N")[..16];
            return Task.FromResult(new CompanyCardPaymentResponseDto { TransactionId = transactionId });
        }

        public async Task<AdminCompanyOrderListResponseDto> GetAdminCompanyOrdersAsync(int page, int pageSize, string? status, string? search)
        {
            var query = _context.CompanyOrders.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(o => o.Status == status.Trim());
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(o =>
                    o.CompanyName.ToLower().Contains(term) ||
                    (o.CompanyEmail != null && o.CompanyEmail.ToLower().Contains(term)));
            }
            var totalCount = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            var orderIds = orders.Select(o => o.OrderId).ToList();
            var linkCounts = await _context.EnrollmentLinks
                .Where(l => l.CompanyOrderId != null && orderIds.Contains(l.CompanyOrderId.Value))
                .GroupBy(l => l.CompanyOrderId!.Value)
                .Select(g => new { OrderId = g.Key, Count = g.Count() })
                .ToListAsync();
            var countDict = linkCounts.ToDictionary(x => x.OrderId, x => x.Count);
            var items = orders.Select(o => new AdminCompanyOrderListItemDto
            {
                OrderId = o.OrderId.ToString(),
                CompanyName = o.CompanyName,
                CompanyEmail = o.CompanyEmail,
                CompanyMobile = o.CompanyMobile,
                TotalAmount = o.TotalAmount,
                PaymentMethod = o.PaymentMethod,
                Status = o.Status,
                CreatedAt = o.CreatedAt,
                CourseCount = countDict.GetValueOrDefault(o.OrderId, 0)
            }).ToList();
            return new AdminCompanyOrderListResponseDto
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<AdminCompanyOrderDetailDto?> GetAdminCompanyOrderByIdAsync(Guid orderId)
        {
            var order = await _context.CompanyOrders.AsNoTracking().FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null) return null;
            var baseUrl = await GetFrontendBaseUrlAsync();
            var links = await _context.EnrollmentLinks
                .AsNoTracking()
                .Include(l => l.Course)
                .Where(l => l.CompanyOrderId == orderId)
                .ToListAsync();
            var linkItems = links.Select(l => new AdminCompanyOrderLinkItemDto
            {
                LinkId = l.LinkId.ToString(),
                CourseName = l.Course?.CourseName ?? "Course",
                FullUrl = $"{baseUrl}/enroll/{l.UniqueCode}",
                UsedCount = l.UsedCount,
                MaxUses = l.MaxUses,
                IsActive = l.IsActive
            }).ToList();
            return new AdminCompanyOrderDetailDto
            {
                OrderId = order.OrderId.ToString(),
                CompanyName = order.CompanyName,
                CompanyEmail = order.CompanyEmail,
                CompanyMobile = order.CompanyMobile,
                TotalAmount = order.TotalAmount,
                PaymentMethod = order.PaymentMethod,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                CourseCount = links.Count,
                Links = linkItems
            };
        }

        public async Task<bool> UpdateCompanyOrderStatusAsync(Guid orderId, string status)
        {
            var order = await _context.CompanyOrders.FindAsync(orderId);
            if (order == null) return false;
            order.Status = status?.Trim() ?? order.Status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetCompanyOrderCountAsync()
        {
            return await _context.CompanyOrders.CountAsync();
        }

        public async Task<OneTimeLinkCompleteResponseDto> CompleteEnrollmentViaLinkAsync(string code, OneTimeLinkCompleteRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName?.Trim()))
                throw new InvalidOperationException("Full name is required.");
            if (string.IsNullOrWhiteSpace(request.Email?.Trim()))
                throw new InvalidOperationException("Email is required.");
            if (string.IsNullOrWhiteSpace(request.Phone?.Trim()))
                throw new InvalidOperationException("Phone is required.");
            if (string.IsNullOrWhiteSpace(request.Password))
                throw new InvalidOperationException("Password is required.");

            var link = await _context.EnrollmentLinks
                .Include(l => l.Course)
                .Include(l => l.CourseDate)
                .FirstOrDefaultAsync(l => l.UniqueCode == code && l.IsActive);

            if (link == null)
                throw new InvalidOperationException("Enrollment link not found or expired");

            if (link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
                throw new InvalidOperationException("Enrollment link has expired");

            if (link.MaxUses.HasValue && link.UsedCount >= link.MaxUses.Value)
                throw new InvalidOperationException("This enrollment link has already been used");

            if (!link.CourseId.HasValue)
                throw new InvalidOperationException("This link is not associated with a course");

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email.Trim());
            if (existingUser != null)
                throw new InvalidOperationException("An account with this email already exists");

            var courseDateId = link.CourseDateId;
            if (courseDateId == null)
            {
                var firstDate = await _context.CourseDates
                    .Where(cd => cd.CourseId == link.CourseId && cd.IsActive && cd.ScheduledDate >= DateTime.UtcNow.Date)
                    .OrderBy(cd => cd.ScheduledDate)
                    .FirstOrDefaultAsync();
                if (firstDate == null)
                {
                    // No future course date: create one for today so enrollment can proceed
                    var today = DateTime.UtcNow.Date;
                    var newCourseDate = new CourseDate
                    {
                        CourseDateId = Guid.NewGuid(),
                        CourseId = link.CourseId!.Value,
                        ScheduledDate = today,
                        IsActive = true,
                        CurrentEnrollments = 0,
                        MaxCapacity = 30,
                        DateType = "Default",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.CourseDates.Add(newCourseDate);
                    await _context.SaveChangesAsync();
                    courseDateId = newCourseDate.CourseDateId;
                    _logger.LogInformation("Created default course date for today ({Date}) for course {CourseId} (no existing date).", today, link.CourseId);
                }
                else
                {
                    courseDateId = firstDate.CourseDateId;
                }
            }

            var user = new User
            {
                UserId = Guid.NewGuid(),
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                PhoneNumber = request.Phone.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                UserType = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Users.AddAsync(user);

            var student = new Student
            {
                StudentId = Guid.NewGuid(),
                UserId = user.UserId,
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                PhoneNumber = request.Phone.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Students.AddAsync(student);

            var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
            if (studentRole != null)
            {
                await _context.UserRoles.AddAsync(new UserRole
                {
                    UserRoleId = Guid.NewGuid(),
                    UserId = user.UserId,
                    RoleId = studentRole.RoleId,
                    AssignedAt = DateTime.UtcNow
                });
            }

            var courseDate = await _context.CourseDates.FindAsync(courseDateId);
            if (courseDate == null)
                throw new InvalidOperationException("Course date not found");

            if (courseDate.CurrentEnrollments >= (courseDate.MaxCapacity ?? 30))
                throw new InvalidOperationException("This course date is fully booked");

            var enrollment = new EnrollmentEntity
            {
                EnrollmentId = Guid.NewGuid(),
                StudentId = student.StudentId,
                CourseId = link.CourseId!.Value,
                CourseDateId = courseDateId.Value,
                Status = "Pending",
                PaymentStatus = "Paid",
                EnrolledAt = DateTime.UtcNow
            };
            await _context.Enrollments.AddAsync(enrollment);
            courseDate.CurrentEnrollments++;

            link.UsedCount++;
            link.UpdatedAt = DateTime.UtcNow;
            if (link.MaxUses == 1)
                link.IsActive = false;

            await _context.SaveChangesAsync();

            var loginBaseUrl = await GetFrontendBaseUrlAsync();
            try
            {
                await _emailService.SendEnrollmentLinkRegistrationConfirmationAsync(
                    user.Email,
                    user.FullName,
                    link.Course?.CourseName ?? "Course",
                    link.Course?.CourseCode,
                    courseDate.ScheduledDate,
                    courseDate.StartTime,
                    courseDate.EndTime,
                    courseDate.Location,
                    loginBaseUrl);
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send enrollment confirmation email to {Email}. Enrollment via link {Code} completed successfully.", user.Email, code);
            }

            return new OneTimeLinkCompleteResponseDto
            {
                UserId = user.UserId.ToString(),
                StudentId = student.StudentId.ToString(),
                Email = user.Email,
                FullName = user.FullName
            };
        }

        private async Task<EnrollmentLinkResponseDto> MapToResponseDto(EnrollmentLinkEntity link, bool allowPayLater)
        {
            var baseUrl = await GetFrontendBaseUrlAsync();
            var course = link.Course;
            var courseDate = link.CourseDate;

            return new EnrollmentLinkResponseDto
            {
                LinkId = link.LinkId.ToString(),
                Name = link.Name ?? string.Empty,
                Description = link.Description,
                CourseId = link.CourseId?.ToString(),
                CourseName = course?.CourseName,
                CourseDateId = link.CourseDateId?.ToString(),
                CourseDateRange = courseDate != null
                    ? $"{courseDate.ScheduledDate:dd/MM/yyyy}"
                    : null,
                UniqueCode = link.UniqueCode,
                FullUrl = $"{baseUrl}/enroll/{link.UniqueCode}",
                QrCodeDataUrl = link.QrCodeData ?? "",
                CreatedAt = link.CreatedAt,
                ExpiresAt = link.ExpiresAt,
                MaxUses = link.MaxUses,
                UsedCount = link.UsedCount,
                IsActive = link.IsActive,
                AllowPayLater = allowPayLater
            };
        }

        /// <summary>
        /// Generates a unique 8-character code for enrollment links. Uses Guid to avoid collisions when creating multiple links in one request.
        /// </summary>
        private string GenerateUniqueCode()
        {
            return Guid.NewGuid().ToString("N")[..8];
        }

        private string GenerateQRCode(string url)
        {
            try
            {
                using var qrGenerator = new QRCodeGenerator();
                using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
                using var qrCode = new PngByteQRCode(qrCodeData);
                var qrCodeBytes = qrCode.GetGraphic(10);
                return $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating QR code");
                return "";
            }
        }
    }
}
