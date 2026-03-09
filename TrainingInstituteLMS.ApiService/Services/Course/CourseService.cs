using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.Data.Data;
using TrainingInstituteLMS.Data.Entities.Courses;
using TrainingInstituteLMS.DTOs.DTOs.Requests.Course;
using TrainingInstituteLMS.DTOs.DTOs.Responses.Course;

namespace TrainingInstituteLMS.ApiService.Services.Course
{
    public class CourseService : ICourseService
    {
        private readonly TrainingLMSDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<CourseService> _logger;

        public CourseService(
            TrainingLMSDbContext context, 
            IFileStorageService fileStorageService,
            ILogger<CourseService> logger)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<CourseResponseDto?> CreateCourseAsync(CreateCourseRequestDto request, Guid? createdBy = null)
        {
            // Use defaults for optional fields
            var courseCode = !string.IsNullOrWhiteSpace(request.CourseCode)
                ? request.CourseCode.Trim()
                : $"COURSE-{Guid.NewGuid():N}";
            var courseName = !string.IsNullOrWhiteSpace(request.CourseName)
                ? request.CourseName.Trim()
                : "Untitled Course";
            var price = request.Price ?? 0;

            // Check if course code already exists (only when provided by user)
            if (!string.IsNullOrWhiteSpace(request.CourseCode) && await CourseCodeExistsAsync(courseCode))
            {
                return null;
            }

            // Validate category if provided
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.CourseCategories
                    .AnyAsync(c => c.CategoryId == request.CategoryId.Value && c.IsActive);
                if (!categoryExists)
                {
                    return null;
                }
            }

            // Process image before transaction (to avoid long-running transaction)
            var processedImageUrl = await ProcessImageUrlAsync(request.ImageUrl);

            // Use execution strategy to handle retries with transactions
            var strategy = _context.Database.CreateExecutionStrategy();

            Guid courseId = Guid.Empty;

            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Get DisplayOrder for new course (max in category + 1, or 0 if first)
                    int displayOrder = 0;
                    if (request.CategoryId.HasValue)
                    {
                        var maxOrder = await _context.Courses
                            .Where(c => c.CategoryId == request.CategoryId.Value)
                            .MaxAsync(c => (int?)c.DisplayOrder) ?? -1;
                        displayOrder = maxOrder + 1;
                    }

                    // Create the course
                    var course = new Data.Entities.Courses.Course
                    {
                        CourseCode = courseCode,
                        CourseName = courseName,
                        CategoryId = request.CategoryId,
                        Duration = request.Duration,
                        Price = price,
                        OriginalPrice = request.OriginalPrice,
                        PromoPrice = request.PromoPrice,
                        PromoOriginalPrice = request.PromoOriginalPrice,
                        ImageUrl = processedImageUrl,
                        ValidityPeriod = request.ValidityPeriod,
                        DeliveryMethod = request.DeliveryMethod,
                        Location = request.Location,
                        CourseDescription = request.CourseDescription,
                        Description = GenerateShortDescription(request),
                        ResourcePdfTitle = request.ResourcePdfTitle,
                        ResourcePdfUrl = request.ResourcePdfUrl,
                        ExperienceBookingEnabled = request.ExperienceBookingEnabled,
                        ExperiencePrice = request.ExperiencePrice,
                        ExperienceOriginalPrice = request.ExperienceOriginalPrice,
                        NoExperiencePrice = request.NoExperiencePrice,
                        NoExperienceOriginalPrice = request.NoExperienceOriginalPrice,
                        IsActive = true,
                        DisplayOrder = displayOrder,
                        CreatedBy = createdBy,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Courses.Add(course);
                    await _context.SaveChangesAsync();

                    courseId = course.CourseId;

                    // Create course rule
                    var courseRule = new CourseRule
                    {
                        CourseId = course.CourseId,
                        HasTheory = request.HasTheory,
                        HasPractical = request.HasPractical,
                        HasExam = request.HasExam,
                        RequiresTheoryClasses = request.HasTheory,
                        RequiresPracticalSessions = request.HasPractical,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.CourseRules.Add(courseRule);

                    // Create entry requirements
                    if (request.EntryRequirements.Any())
                    {
                        var entryRequirements = request.EntryRequirements
                            .Where(r => !string.IsNullOrWhiteSpace(r))
                            .Select((r, index) => new CourseEntryRequirement
                            {
                                CourseId = course.CourseId,
                                Requirement = r,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CourseEntryRequirements.AddRange(entryRequirements);
                    }

                    // Create training overview
                    if (request.TrainingOverview.Any())
                    {
                        var trainingOverviews = request.TrainingOverview
                            .Where(t => !string.IsNullOrWhiteSpace(t))
                            .Select((t, index) => new CourseTrainingOverview
                            {
                                CourseId = course.CourseId,
                                OverviewItem = t,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CourseTrainingOverviews.AddRange(trainingOverviews);
                    }

                    // Create vocational outcomes
                    if (request.VocationalOutcome.Any())
                    {
                        var outcomes = request.VocationalOutcome
                            .Where(v => !string.IsNullOrWhiteSpace(v))
                            .Select((v, index) => new CourseVocationalOutcome
                            {
                                CourseId = course.CourseId,
                                Outcome = v,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CourseVocationalOutcomes.AddRange(outcomes);
                    }

                    // Create pathways
                    if (!string.IsNullOrWhiteSpace(request.PathwaysDescription) || request.PathwaysCertifications.Any())
                    {
                        if (!string.IsNullOrWhiteSpace(request.PathwaysDescription))
                        {
                            _context.CoursePathways.Add(new CoursePathway
                            {
                                CourseId = course.CourseId,
                                PathwayDescription = request.PathwaysDescription,
                                DisplayOrder = 0,
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        var pathways = request.PathwaysCertifications
                            .Where(p => !string.IsNullOrWhiteSpace(p))
                            .Select((p, index) => new CoursePathway
                            {
                                CourseId = course.CourseId,
                                CertificationCode = p,
                                DisplayOrder = index + 1,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CoursePathways.AddRange(pathways);
                    }

                    // Create fees and charges
                    if (request.FeesAndCharges.Any())
                    {
                        var fees = request.FeesAndCharges
                            .Where(f => !string.IsNullOrWhiteSpace(f))
                            .Select((f, index) => new CourseFeeCharge
                            {
                                CourseId = course.CourseId,
                                FeeDescription = f,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CourseFeeCharges.AddRange(fees);
                    }

                    // Create optional charges
                    if (request.OptionalCharges.Any())
                    {
                        var optionalCharges = request.OptionalCharges
                            .Where(o => !string.IsNullOrWhiteSpace(o))
                            .Select((o, index) => new CourseOptionalCharge
                            {
                                CourseId = course.CourseId,
                                ChargeDescription = o,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();

                        _context.CourseOptionalCharges.AddRange(optionalCharges);
                    }

                    // Create combo offer if enabled
                    if (request.ComboOfferEnabled && !string.IsNullOrWhiteSpace(request.ComboDescription) && request.ComboPrice.HasValue)
                    {
                        var comboOffer = new CourseComboOffer
                        {
                            CourseId = course.CourseId,
                            ComboDescription = request.ComboDescription,
                            ComboPrice = request.ComboPrice.Value,
                            ComboDuration = request.ComboDuration,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.CourseComboOffers.Add(comboOffer);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            return await GetCourseByIdAsync(courseId);
        }

        public async Task<CourseResponseDto?> GetCourseByIdAsync(Guid courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.EntryRequirements.OrderBy(e => e.DisplayOrder))
                .Include(c => c.TrainingOverviews.OrderBy(t => t.DisplayOrder))
                .Include(c => c.VocationalOutcomes.OrderBy(v => v.DisplayOrder))
                .Include(c => c.Pathways.OrderBy(p => p.DisplayOrder))
                .Include(c => c.FeesAndCharges.OrderBy(f => f.DisplayOrder))
                .Include(c => c.OptionalCharges.OrderBy(o => o.DisplayOrder))
                .Include(c => c.ComboOffer)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null) return null;

            return MapToCourseResponseDto(course);
        }

        public async Task<CourseResponseDto?> GetCourseByCodeAsync(string courseCode)
        {
            var course = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.EntryRequirements.OrderBy(e => e.DisplayOrder))
                .Include(c => c.TrainingOverviews.OrderBy(t => t.DisplayOrder))
                .Include(c => c.VocationalOutcomes.OrderBy(v => v.DisplayOrder))
                .Include(c => c.Pathways.OrderBy(p => p.DisplayOrder))
                .Include(c => c.FeesAndCharges.OrderBy(f => f.DisplayOrder))
                .Include(c => c.OptionalCharges.OrderBy(o => o.DisplayOrder))
                .Include(c => c.ComboOffer)
                .FirstOrDefaultAsync(c => c.CourseCode == courseCode);

            if (course == null) return null;

            return MapToCourseResponseDto(course);
        }

        public async Task<CourseResponseDto?> UpdateCourseAsync(Guid courseId, UpdateCourseRequestDto request)
        {
            var course = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.EntryRequirements)
                .Include(c => c.TrainingOverviews)
                .Include(c => c.VocationalOutcomes)
                .Include(c => c.Pathways)
                .Include(c => c.FeesAndCharges)
                .Include(c => c.OptionalCharges)
                .Include(c => c.ComboOffer)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null) return null;

            // Check for duplicate course code
            if (!string.IsNullOrWhiteSpace(request.CourseCode) &&
                request.CourseCode != course.CourseCode &&
                await CourseCodeExistsAsync(request.CourseCode, courseId))
            {
                return null;
            }

            // Validate category if provided
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.CourseCategories
                    .AnyAsync(c => c.CategoryId == request.CategoryId.Value && c.IsActive);
                if (!categoryExists)
                {
                    return null;
                }
            }

            // Process new image before transaction (to avoid long-running transaction)
            string? processedImageUrl = null;
            bool shouldUpdateImage = false;
            
            if (request.ImageUrl != null)
            {
                // Check if it's a NEW image (base64) or existing image (URL)
                if (request.ImageUrl.StartsWith("data:image/"))
                {
                    // It's a base64 image - user is uploading a NEW image
                    processedImageUrl = await ProcessImageUrlAsync(request.ImageUrl);
                    shouldUpdateImage = true; // This is definitely a new image
                    
                    _logger.LogInformation(
                        "📸 NEW IMAGE UPLOAD - CourseId: {CourseId}, ProcessedPath: {ProcessedPath}",
                        courseId, processedImageUrl);
                }
                else
                {
                    // It's a URL - could be existing Azure URL or external URL
                    // Extract the relative path from Azure URL if it's our blob
                    var extractedPath = ExtractRelativePathFromUrl(request.ImageUrl);
                    
                    _logger.LogInformation(
                        "🔍 IMAGE URL CHECK - CourseId: {CourseId}, RequestUrl: {RequestUrl}, ExtractedPath: {ExtractedPath}, CurrentPath: {CurrentPath}",
                        courseId, request.ImageUrl, extractedPath, course.ImageUrl);
                    
                    // Only update if it's actually different
                    if (extractedPath != course.ImageUrl)
                    {
                        processedImageUrl = extractedPath;
                        shouldUpdateImage = true;
                        
                        _logger.LogInformation(
                            "🔄 IMAGE PATH CHANGED - CourseId: {CourseId}, From: {OldPath}, To: {NewPath}",
                            courseId, course.ImageUrl, extractedPath);
                    }
                    else
                    {
                        _logger.LogInformation(
                            "✅ IMAGE UNCHANGED - CourseId: {CourseId}, Path: {ImagePath}",
                            courseId, course.ImageUrl);
                    }
                }
            }

            // Use execution strategy to handle retries with transactions
            var strategy = _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Update basic course properties
                    if (!string.IsNullOrWhiteSpace(request.CourseCode))
                        course.CourseCode = request.CourseCode;
                    if (!string.IsNullOrWhiteSpace(request.CourseName))
                        course.CourseName = request.CourseName;
                    if (request.CategoryId.HasValue)
                        course.CategoryId = request.CategoryId;
                    if (request.Duration != null)
                        course.Duration = request.Duration;
                    if (request.Price.HasValue)
                        course.Price = request.Price.Value;
                    if (request.OriginalPrice.HasValue)
                        course.OriginalPrice = request.OriginalPrice;
                    if (request.PromoPrice.HasValue)
                        course.PromoPrice = request.PromoPrice;
                    if (request.PromoOriginalPrice.HasValue)
                        course.PromoOriginalPrice = request.PromoOriginalPrice;
                    
                    // CRITICAL FIX: Only update/delete image if it's actually changing
                    if (shouldUpdateImage && processedImageUrl != null)
                    {
                        _logger.LogWarning(
                            "🖼️ COURSE IMAGE UPDATE CONFIRMED - CourseId: {CourseId}, CourseName: {CourseName}, OldImage: {OldImage}, NewImage: {NewImage}", 
                            course.CourseId, course.CourseName, course.ImageUrl, processedImageUrl);
                        
                        // Delete old image ONLY if:
                        // 1. There IS an old image
                        // 2. Old image is stored in our system (starts with "course-images/")
                        // 3. We have a new image to replace it with
                        if (!string.IsNullOrEmpty(course.ImageUrl) &&
                            course.ImageUrl.StartsWith("course-images/"))
                        {
                            _logger.LogWarning(
                                "🗑️ DELETING OLD COURSE IMAGE - Path: {ImagePath}, CourseId: {CourseId}, CourseName: {CourseName}", 
                                course.ImageUrl, course.CourseId, course.CourseName);
                            
                            await _fileStorageService.DeleteFileAsync(course.ImageUrl);
                        }
                        
                        course.ImageUrl = processedImageUrl;
                    }
                    
                    if (request.ValidityPeriod != null)
                        course.ValidityPeriod = request.ValidityPeriod;
                    if (request.DeliveryMethod != null)
                        course.DeliveryMethod = request.DeliveryMethod;
                    if (request.Location != null)
                        course.Location = request.Location;
                    if (request.CourseDescription != null)
                        course.CourseDescription = request.CourseDescription;
                    if (request.ResourcePdfTitle != null)
                        course.ResourcePdfTitle = request.ResourcePdfTitle;
                    if (request.ResourcePdfUrl != null)
                        course.ResourcePdfUrl = request.ResourcePdfUrl;
                    if (request.IsActive.HasValue)
                        course.IsActive = request.IsActive.Value;

                    // Update experience booking fields
                    if (request.ExperienceBookingEnabled.HasValue)
                        course.ExperienceBookingEnabled = request.ExperienceBookingEnabled.Value;
                    if (request.ExperiencePrice.HasValue)
                        course.ExperiencePrice = request.ExperiencePrice;
                    if (request.ExperienceOriginalPrice.HasValue)
                        course.ExperienceOriginalPrice = request.ExperienceOriginalPrice;
                    if (request.NoExperiencePrice.HasValue)
                        course.NoExperiencePrice = request.NoExperiencePrice;
                    if (request.NoExperienceOriginalPrice.HasValue)
                        course.NoExperienceOriginalPrice = request.NoExperienceOriginalPrice;

                    course.UpdatedAt = DateTime.UtcNow;

                    // Update course rule
                    if (course.CourseRule != null)
                    {
                        if (request.HasTheory.HasValue)
                            course.CourseRule.HasTheory = request.HasTheory.Value;
                        if (request.HasPractical.HasValue)
                            course.CourseRule.HasPractical = request.HasPractical.Value;
                        if (request.HasExam.HasValue)
                            course.CourseRule.HasExam = request.HasExam.Value;
                    }

                    // Update entry requirements if provided
                    if (request.EntryRequirements != null)
                    {
                        _context.CourseEntryRequirements.RemoveRange(course.EntryRequirements);
                        var entryRequirements = request.EntryRequirements
                            .Where(r => !string.IsNullOrWhiteSpace(r))
                            .Select((r, index) => new CourseEntryRequirement
                            {
                                CourseId = course.CourseId,
                                Requirement = r,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();
                        _context.CourseEntryRequirements.AddRange(entryRequirements);
                    }

                    // Update training overview if provided
                    if (request.TrainingOverview != null)
                    {
                        _context.CourseTrainingOverviews.RemoveRange(course.TrainingOverviews);
                        var trainingOverviews = request.TrainingOverview
                            .Where(t => !string.IsNullOrWhiteSpace(t))
                            .Select((t, index) => new CourseTrainingOverview
                            {
                                CourseId = course.CourseId,
                                OverviewItem = t,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();
                        _context.CourseTrainingOverviews.AddRange(trainingOverviews);
                    }

                    // Update vocational outcomes if provided
                    if (request.VocationalOutcome != null)
                    {
                        _context.CourseVocationalOutcomes.RemoveRange(course.VocationalOutcomes);
                        var outcomes = request.VocationalOutcome
                            .Where(v => !string.IsNullOrWhiteSpace(v))
                            .Select((v, index) => new CourseVocationalOutcome
                            {
                                CourseId = course.CourseId,
                                Outcome = v,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();
                        _context.CourseVocationalOutcomes.AddRange(outcomes);
                    }

                    // Update pathways if provided
                    if (request.PathwaysDescription != null || request.PathwaysCertifications != null)
                    {
                        _context.CoursePathways.RemoveRange(course.Pathways);

                        if (!string.IsNullOrWhiteSpace(request.PathwaysDescription))
                        {
                            _context.CoursePathways.Add(new CoursePathway
                            {
                                CourseId = course.CourseId,
                                PathwayDescription = request.PathwaysDescription,
                                DisplayOrder = 0,
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        if (request.PathwaysCertifications != null)
                        {
                            var pathways = request.PathwaysCertifications
                                .Where(p => !string.IsNullOrWhiteSpace(p))
                                .Select((p, index) => new CoursePathway
                                {
                                    CourseId = course.CourseId,
                                    CertificationCode = p,
                                    DisplayOrder = index + 1,
                                    CreatedAt = DateTime.UtcNow
                                }).ToList();
                            _context.CoursePathways.AddRange(pathways);
                        }
                    }

                    // Update fees and charges if provided
                    if (request.FeesAndCharges != null)
                    {
                        _context.CourseFeeCharges.RemoveRange(course.FeesAndCharges);
                        var fees = request.FeesAndCharges
                            .Where(f => !string.IsNullOrWhiteSpace(f))
                            .Select((f, index) => new CourseFeeCharge
                            {
                                CourseId = course.CourseId,
                                FeeDescription = f,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();
                        _context.CourseFeeCharges.AddRange(fees);
                    }

                    // Update optional charges if provided
                    if (request.OptionalCharges != null)
                    {
                        _context.CourseOptionalCharges.RemoveRange(course.OptionalCharges);
                        var optionalCharges = request.OptionalCharges
                            .Where(o => !string.IsNullOrWhiteSpace(o))
                            .Select((o, index) => new CourseOptionalCharge
                            {
                                CourseId = course.CourseId,
                                ChargeDescription = o,
                                DisplayOrder = index,
                                CreatedAt = DateTime.UtcNow
                            }).ToList();
                        _context.CourseOptionalCharges.AddRange(optionalCharges);
                    }

                    // Update combo offer
                    if (request.ComboOfferEnabled.HasValue)
                    {
                        if (request.ComboOfferEnabled.Value &&
                            !string.IsNullOrWhiteSpace(request.ComboDescription) &&
                            request.ComboPrice.HasValue)
                        {
                            if (course.ComboOffer != null)
                            {
                                course.ComboOffer.ComboDescription = request.ComboDescription;
                                course.ComboOffer.ComboPrice = request.ComboPrice.Value;
                                course.ComboOffer.ComboDuration = request.ComboDuration;
                                course.ComboOffer.IsActive = true;
                            }
                            else
                            {
                                _context.CourseComboOffers.Add(new CourseComboOffer
                                {
                                    CourseId = course.CourseId,
                                    ComboDescription = request.ComboDescription,
                                    ComboPrice = request.ComboPrice.Value,
                                    ComboDuration = request.ComboDuration,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                        else if (course.ComboOffer != null)
                        {
                            _context.CourseComboOffers.Remove(course.ComboOffer);
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            return await GetCourseByIdAsync(courseId);
        }

        public async Task<bool> DeleteCourseAsync(Guid courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Enrollments)
                .Include(c => c.CourseRule)
                .Include(c => c.EntryRequirements)
                .Include(c => c.TrainingOverviews)
                .Include(c => c.VocationalOutcomes)
                .Include(c => c.Pathways)
                .Include(c => c.FeesAndCharges)
                .Include(c => c.OptionalCharges)
                .Include(c => c.ComboOffer)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null) return false;

            // Hard delete: remove all child and related entities first (DB uses Restrict, no cascade)
            var enrollmentIds = course.Enrollments.Select(e => e.EnrollmentId).ToList();

            if (enrollmentIds.Count > 0)
            {
                // Remove enrollment-dependent entities (order matters for FK constraints)
                var certificates = await _context.Certificates.Where(c => enrollmentIds.Contains(c.EnrollmentId)).ToListAsync();
                _context.Certificates.RemoveRange(certificates);

                var certificateApprovals = await _context.CertificateApprovals.Where(ca => enrollmentIds.Contains(ca.EnrollmentId)).ToListAsync();
                _context.CertificateApprovals.RemoveRange(certificateApprovals);

                var examResults = await _context.ExamResults.Where(er => enrollmentIds.Contains(er.EnrollmentId)).ToListAsync();
                _context.ExamResults.RemoveRange(examResults);

                var externalExamLinks = await _context.ExternalExamLinks.Where(eel => enrollmentIds.Contains(eel.EnrollmentId)).ToListAsync();
                _context.ExternalExamLinks.RemoveRange(externalExamLinks);

                var paymentProofs = await _context.PaymentProofs.Where(pp => enrollmentIds.Contains(pp.EnrollmentId)).ToListAsync();
                _context.PaymentProofs.RemoveRange(paymentProofs);

                _context.Enrollments.RemoveRange(course.Enrollments);
            }

            // 1. EnrollmentLinks for this course
            var enrollmentLinks = await _context.EnrollmentLinks
                .Where(el => el.CourseId == courseId)
                .ToListAsync();
            _context.EnrollmentLinks.RemoveRange(enrollmentLinks);

            // 2. CourseDates for this course
            var courseDates = await _context.CourseDates
                .Where(cd => cd.CourseId == courseId)
                .ToListAsync();
            _context.CourseDates.RemoveRange(courseDates);

            // 3. Child collections
            if (course.EntryRequirements?.Any() == true)
                _context.CourseEntryRequirements.RemoveRange(course.EntryRequirements);
            if (course.TrainingOverviews?.Any() == true)
                _context.CourseTrainingOverviews.RemoveRange(course.TrainingOverviews);
            if (course.VocationalOutcomes?.Any() == true)
                _context.CourseVocationalOutcomes.RemoveRange(course.VocationalOutcomes);
            if (course.Pathways?.Any() == true)
                _context.CoursePathways.RemoveRange(course.Pathways);
            if (course.FeesAndCharges?.Any() == true)
                _context.CourseFeeCharges.RemoveRange(course.FeesAndCharges);
            if (course.OptionalCharges?.Any() == true)
                _context.CourseOptionalCharges.RemoveRange(course.OptionalCharges);

            // 4. One-to-one and optional
            if (course.CourseRule != null)
                _context.CourseRules.Remove(course.CourseRule);
            if (course.ComboOffer != null)
                _context.CourseComboOffers.Remove(course.ComboOffer);

            // 5. Course
            _context.Courses.Remove(course);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleCourseStatusAsync(Guid courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return false;

            course.IsActive = !course.IsActive;
            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<CourseListResponseDto> GetAllCoursesAsync(CourseFilterRequestDto filter)
        {
            var query = _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.ComboOffer)
                .AsQueryable();

            query = ApplyFilters(query, filter);

            var totalCount = await query.CountAsync();

            query = ApplySorting(query, filter.SortBy, filter.SortDescending);

            var courses = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new CourseListResponseDto
            {
                Courses = courses.Select(MapToCourseListItemDto).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<CourseListResponseDto> GetActiveCoursesAsync(CourseFilterRequestDto filter)
        {
            filter.IsActive = true;
            return await GetAllCoursesAsync(filter);
        }

        public async Task<List<CourseListItemDto>> GetFeaturedCoursesAsync(int count = 6)
        {
            var courses = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.CourseRule)
                .Include(c => c.ComboOffer)
                .Where(c => c.IsActive)
                .OrderByDescending(c => c.EnrolledStudentsCount)
                .ThenByDescending(c => c.CreatedAt)
                .Take(count)
                .ToListAsync();

            return courses.Select(MapToCourseListItemDto).ToList();
        }

        public async Task<CourseStatsResponseDto> GetCourseStatsAsync()
        {
            var courses = await _context.Courses
                .Include(c => c.Category)
                .Include(c => c.ComboOffer)
                .Include(c => c.Enrollments)
                .ToListAsync();

            var categories = await _context.CourseCategories
                .Where(c => c.IsActive)
                .CountAsync();

            // Category statistics
            var categoryStats = courses
                .Where(c => c.Category != null)
                .GroupBy(c => new { c.CategoryId, c.Category!.CategoryName })
                .Select(g => new CategoryStatsDto
                {
                    CategoryId = g.Key.CategoryId ?? Guid.Empty,
                    Category = g.Key.CategoryName,
                    CourseCount = g.Count(),
                    EnrollmentCount = g.Sum(c => c.Enrollments.Count),
                    Revenue = g.Sum(c => c.Enrollments.Sum(e => e.AmountPaid))
                })
                .OrderByDescending(c => c.CourseCount)
                .ToList();

            // Monthly enrollment statistics (last 12 months)
            var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
            var monthlyStats = await _context.Enrollments
                .Where(e => e.EnrolledAt >= twelveMonthsAgo)
                .GroupBy(e => new { e.EnrolledAt.Year, e.EnrolledAt.Month })
                .Select(g => new MonthlyStatsDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                    EnrollmentCount = g.Count(),
                    Revenue = g.Sum(e => e.AmountPaid)
                })
                .OrderBy(m => m.Year)
                .ThenBy(m => m.Month)
                .ToListAsync();

            // Top courses by enrollment
            var topCourses = courses
                .OrderByDescending(c => c.Enrollments.Count)
                .Take(10)
                .Select(c => new TopCourseDto
                {
                    CourseId = c.CourseId,
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    CategoryName = c.Category?.CategoryName,
                    EnrollmentCount = c.Enrollments.Count,
                    Revenue = c.Enrollments.Sum(e => e.AmountPaid)
                })
                .ToList();

            var totalEnrollments = courses.Sum(c => c.Enrollments.Count);
            var totalRevenue = courses.Sum(c => c.Enrollments.Sum(e => e.AmountPaid));

            return new CourseStatsResponseDto
            {
                TotalCourses = courses.Count,
                ActiveCourses = courses.Count(c => c.IsActive),
                InactiveCourses = courses.Count(c => !c.IsActive),
                CoursesWithComboOffers = courses.Count(c => c.ComboOffer != null && c.ComboOffer.IsActive),
                TotalEnrollments = totalEnrollments,
                TotalRevenue = totalRevenue,
                AverageCourseprice = courses.Count > 0 ? courses.Average(c => c.Price) : 0,
                TotalCategories = categories,
                CategoryStats = categoryStats,
                MonthlyEnrollments = monthlyStats,
                TopCourses = topCourses
            };
        }

        public async Task<bool> CourseCodeExistsAsync(string courseCode, Guid? excludeCourseId = null)
        {
            var query = _context.Courses.Where(c => c.CourseCode == courseCode);

            if (excludeCourseId.HasValue)
            {
                query = query.Where(c => c.CourseId != excludeCourseId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> ReorderCoursesAsync(Guid categoryId, Guid[] courseIds)
        {
            if (courseIds == null || courseIds.Length == 0)
                return true;

            var courses = await _context.Courses
                .Where(c => c.CategoryId == categoryId && courseIds.Contains(c.CourseId))
                .ToListAsync();

            if (courses.Count != courseIds.Length)
                return false;

            for (int i = 0; i < courseIds.Length; i++)
            {
                var course = courses.First(c => c.CourseId == courseIds[i]);
                course.DisplayOrder = i;
                course.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        #region Private Helper Methods

        private static string GenerateShortDescription(CreateCourseRequestDto request)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(request.DeliveryMethod))
                parts.Add($"🧑‍🦰 DELIVERY: {request.DeliveryMethod}");

            parts.Add($"💵 COST: ${request.Price ?? 0}");

            if (!string.IsNullOrWhiteSpace(request.Location))
                parts.Add($"📌 LOCATION: {request.Location}");

            return string.Join(" ", parts);
        }

        private static IQueryable<Data.Entities.Courses.Course> ApplyFilters(
            IQueryable<Data.Entities.Courses.Course> query,
            CourseFilterRequestDto filter)
        {
            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var searchLower = filter.SearchQuery.ToLower();
                query = query.Where(c =>
                    c.CourseName.ToLower().Contains(searchLower) ||
                    c.CourseCode.ToLower().Contains(searchLower) ||
                    (c.Description != null && c.Description.ToLower().Contains(searchLower)) ||
                    (c.Category != null && c.Category.CategoryName.ToLower().Contains(searchLower)));
            }

            if (filter.CategoryId.HasValue)
            {
                query = query.Where(c => c.CategoryId == filter.CategoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.CategoryName) && filter.CategoryName != "All Courses")
            {
                query = query.Where(c => c.Category != null && c.Category.CategoryName == filter.CategoryName);
            }

            if (filter.MinPrice.HasValue)
            {
                query = query.Where(c => c.Price >= filter.MinPrice.Value);
            }

            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(c => c.Price <= filter.MaxPrice.Value);
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(c => c.IsActive == filter.IsActive.Value);
            }

            if (filter.HasComboOffer.HasValue && filter.HasComboOffer.Value)
            {
                query = query.Where(c => c.ComboOffer != null && c.ComboOffer.IsActive);
            }

            return query;
        }

        private static IQueryable<Data.Entities.Courses.Course> ApplySorting(
            IQueryable<Data.Entities.Courses.Course> query,
            string sortBy,
            bool sortDescending)
        {
            return sortBy.ToLower() switch
            {
                "displayorder" or "display" or "landing" => query
                    .OrderBy(c => c.Category != null ? c.Category.DisplayOrder : int.MaxValue)
                    .ThenBy(c => c.DisplayOrder)
                    .ThenBy(c => c.CourseName),
                "name" or "coursename" => sortDescending
                    ? query.OrderByDescending(c => c.CourseName)
                    : query.OrderBy(c => c.CourseName),
                "price" => sortDescending
                    ? query.OrderByDescending(c => c.Price)
                    : query.OrderBy(c => c.Price),
                "students" or "enrolledstudentscount" => sortDescending
                    ? query.OrderByDescending(c => c.EnrolledStudentsCount)
                    : query.OrderBy(c => c.EnrolledStudentsCount),
                "category" => sortDescending
                    ? query.OrderByDescending(c => c.Category != null ? c.Category.CategoryName : "")
                    : query.OrderBy(c => c.Category != null ? c.Category.CategoryName : ""),
                _ => sortDescending
                    ? query.OrderByDescending(c => c.CreatedAt)
                    : query.OrderBy(c => c.CreatedAt)
            };
        }

        private CourseResponseDto MapToCourseResponseDto(Data.Entities.Courses.Course course)
        {
            var pathwayDescription = course.Pathways
                .FirstOrDefault(p => !string.IsNullOrEmpty(p.PathwayDescription))?.PathwayDescription;

            var certifications = course.Pathways
                .Where(p => !string.IsNullOrEmpty(p.CertificationCode))
                .Select(p => p.CertificationCode!)
                .ToList();

            return new CourseResponseDto
            {
                CourseId = course.CourseId,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                CategoryId = course.CategoryId,
                CategoryName = course.Category?.CategoryName,
                Duration = course.Duration,
                Price = course.Price,
                OriginalPrice = course.OriginalPrice,
                PromoPrice = course.PromoPrice,
                PromoOriginalPrice = course.PromoOriginalPrice,
                ImageUrl = GetImageFullUrl(course.ImageUrl),
                HasTheory = course.CourseRule?.HasTheory ?? true,
                HasPractical = course.CourseRule?.HasPractical ?? true,
                HasExam = course.CourseRule?.HasExam ?? true,
                ValidityPeriod = course.ValidityPeriod,
                DeliveryMethod = course.DeliveryMethod,
                Location = course.Location,
                Description = course.Description,
                CourseDescription = course.CourseDescription,
                EnrolledStudentsCount = course.EnrolledStudentsCount,
                IsActive = course.IsActive,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                ExperienceBookingEnabled = course.ExperienceBookingEnabled,
                ExperiencePrice = course.ExperiencePrice,
                ExperienceOriginalPrice = course.ExperienceOriginalPrice,
                NoExperiencePrice = course.NoExperiencePrice,
                NoExperienceOriginalPrice = course.NoExperienceOriginalPrice,
                EntryRequirements = course.EntryRequirements.Select(e => e.Requirement).ToList(),
                TrainingOverview = course.TrainingOverviews.Select(t => t.OverviewItem).ToList(),
                VocationalOutcome = course.VocationalOutcomes.Select(v => v.Outcome).ToList(),
                Pathways = (pathwayDescription != null || certifications.Any())
                    ? new CoursePathwaysDto
                    {
                        Description = pathwayDescription,
                        Certifications = certifications
                    }
                    : null,
                FeesAndCharges = course.FeesAndCharges.Select(f => f.FeeDescription).ToList(),
                OptionalCharges = course.OptionalCharges.Select(o => o.ChargeDescription).ToList(),
                ResourcePdf = (!string.IsNullOrEmpty(course.ResourcePdfTitle) || !string.IsNullOrEmpty(course.ResourcePdfUrl))
                    ? new CourseResourcePdfDto
                    {
                        Title = course.ResourcePdfTitle,
                        Url = course.ResourcePdfUrl
                    }
                    : null,
                ComboOffer = course.ComboOffer != null && course.ComboOffer.IsActive
                    ? new CourseComboOfferDto
                    {
                        Description = course.ComboOffer.ComboDescription,
                        Price = course.ComboOffer.ComboPrice,
                        Duration = course.ComboOffer.ComboDuration
                    }
                    : null
            };
        }

        private CourseListItemDto MapToCourseListItemDto(Data.Entities.Courses.Course course)
        {
            return new CourseListItemDto
            {
                CourseId = course.CourseId,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                CategoryId = course.CategoryId,
                CategoryName = course.Category?.CategoryName,
                Duration = course.Duration,
                Price = course.Price,
                OriginalPrice = course.OriginalPrice,
                PromoPrice = course.PromoPrice,
                PromoOriginalPrice = course.PromoOriginalPrice,
                ImageUrl = GetImageFullUrl(course.ImageUrl),
                HasTheory = course.CourseRule?.HasTheory ?? true,
                HasPractical = course.CourseRule?.HasPractical ?? true,
                HasExam = course.CourseRule?.HasExam ?? true,
                ValidityPeriod = course.ValidityPeriod,
                Description = course.Description,
                EnrolledStudentsCount = course.EnrolledStudentsCount,
                DisplayOrder = course.DisplayOrder,
                IsActive = course.IsActive,
                HasComboOffer = course.ComboOffer != null && course.ComboOffer.IsActive,
                CreatedAt = course.CreatedAt,
                ExperienceBookingEnabled = course.ExperienceBookingEnabled,
                ExperiencePrice = course.ExperiencePrice,
                ExperienceOriginalPrice = course.ExperienceOriginalPrice,
                NoExperiencePrice = course.NoExperiencePrice,
                NoExperienceOriginalPrice = course.NoExperienceOriginalPrice
            };
        }

        private async Task<string?> ProcessImageUrlAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            // Check if it's a base64 data URL
            if (!imageUrl.StartsWith("data:image/"))
                return imageUrl; // It's a regular URL, return as-is

            try
            {
                // Parse the base64 data URL
                // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
                var commaIndex = imageUrl.IndexOf(',');
                if (commaIndex == -1)
                    return null;

                var metadata = imageUrl.Substring(0, commaIndex); // data:image/jpeg;base64
                var base64Data = imageUrl.Substring(commaIndex + 1);

                // Extract mime type and extension
                var mimeType = metadata.Split(':')[1].Split(';')[0]; // image/jpeg
                var extension = mimeType switch
                {
                    "image/jpeg" => ".jpg",
                    "image/jpg" => ".jpg",
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    "image/webp" => ".webp",
                    "image/bmp" => ".bmp",
                    _ => ".jpg"
                };

                // Convert base64 to bytes
                var imageBytes = Convert.FromBase64String(base64Data);

                // Create IFormFile from bytes
                var fileName = $"course-image{extension}";
                using var stream = new MemoryStream(imageBytes);
                var formFile = new FormFile(stream, 0, imageBytes.Length, "file", fileName)
                {
                    Headers = new HeaderDictionary(),
                    ContentType = mimeType
                };

                // Upload using file storage service
                var uploadResult = await _fileStorageService.UploadFileAsync(formFile, "course-images");

                if (uploadResult.Success)
                {
                    return uploadResult.RelativePath;
                }

                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private string? GetImageFullUrl(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return null;

            // If it's already a full URL, return as-is
            if (imageUrl.StartsWith("http://") || imageUrl.StartsWith("https://"))
                return imageUrl;

            // It's a relative path, convert to full URL
            return _fileStorageService.GetFileUrl(imageUrl);
        }

        /// <summary>
        /// Extract relative path from Azure Blob URL or return the path as-is
        /// Example: "https://storage.blob.core.windows.net/course-images/abc.jpg" -> "course-images/abc.jpg"
        /// </summary>
        private string? ExtractRelativePathFromUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            // If it's already a relative path, return as-is
            if (!url.StartsWith("http://") && !url.StartsWith("https://"))
                return url;

            try
            {
                var uri = new Uri(url);
                var pathAndQuery = uri.AbsolutePath.TrimStart('/');

                // If URL is our API proxy (e.g. .../api/files/course-images/xxx.jpg), strip to storage path only
                var filesIndex = pathAndQuery.IndexOf("files/", StringComparison.OrdinalIgnoreCase);
                if (filesIndex >= 0)
                    return pathAndQuery.Substring(filesIndex + 6);

                // Azure Blob or other: path is container-name/virtual-folder/filename
                return pathAndQuery;
            }
            catch
            {
                // If URL parsing fails, return the original
                return url;
            }
        }

        #endregion
    }
}
