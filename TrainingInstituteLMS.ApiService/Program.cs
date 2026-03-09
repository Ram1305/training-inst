using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using TrainingInstituteLMS.ApiService.Configuration;
using TrainingInstituteLMS.ApiService.Services.Auth;
using TrainingInstituteLMS.ApiService.Services.Course;
using TrainingInstituteLMS.ApiService.Services.Course.CourseCategory;
using TrainingInstituteLMS.ApiService.Services.Course.CourseDate;
using TrainingInstituteLMS.ApiService.Services.Enrollment;
using TrainingInstituteLMS.ApiService.Services.Files;
using TrainingInstituteLMS.ApiService.Services.Quiz;
using TrainingInstituteLMS.ApiService.Services.Schedule;
using TrainingInstituteLMS.ApiService.Services.StudentEnrollment;
using TrainingInstituteLMS.ApiService.Services.CompanyManagement;
using TrainingInstituteLMS.ApiService.Services.StudentManagement;
using TrainingInstituteLMS.ApiService.Services.SuperAdmin;
using TrainingInstituteLMS.ApiService.Services.PublicEnrollment;
using TrainingInstituteLMS.ApiService.Services.Payment;
using TrainingInstituteLMS.ApiService.Services.Email;
using TrainingInstituteLMS.ApiService.Services.Reviews;
using TrainingInstituteLMS.ApiService.Services.Gallery;
using TrainingInstituteLMS.Data.Data;

var builder = WebApplication.CreateBuilder(args);

// Support EMAIL_USER and EMAIL_PASS environment variables for email configuration
var emailUser = Environment.GetEnvironmentVariable("EMAIL_USER");
var emailPass = Environment.GetEnvironmentVariable("EMAIL_PASS");
if (!string.IsNullOrEmpty(emailUser))
    builder.Configuration["Email:User"] = emailUser;
if (!string.IsNullOrEmpty(emailPass))
    builder.Configuration["Email:Password"] = emailPass;

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();

builder.Services.AddDbContext<TrainingLMSDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null
            );
        });
});

// Add Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "TrainingLMS.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

// Add Authorization
builder.Services.AddAuthorization();

// Register Auth Service
builder.Services.AddScoped<IAuthService, AuthService>();

// Register Admin Management Service
builder.Services.AddScoped<IAdminManagementService, AdminManagementService>();

// Register Student Management Service
builder.Services.AddScoped<IStudentManagementService, StudentManagementService>();

// Register Company Management Service
builder.Services.AddScoped<ICompanyManagementService, CompanyManagementService>();

// Add Quiz Service
builder.Services.AddScoped<IQuizService, QuizService>();

// Admin quiz ByPass
builder.Services.AddScoped<IAdminQuizService, AdminQuizService>();

// Courses and category services
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICourseDateService, CourseDateService>();

// Google Reviews service
builder.Services.AddScoped<IGoogleReviewService, GoogleReviewService>();

// Gallery service
builder.Services.AddScoped<IGalleryService, GalleryService>();

// Enrollment service
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();

// Schedule service
builder.Services.AddScoped<IScheduleService, ScheduleService>();

// Student Enrollment Form service
builder.Services.AddScoped<IStudentEnrollmentFormService, StudentEnrollmentFormService>();
builder.Services.AddScoped<IEnrollmentFormPdfService, EnrollmentFormPdfService>();

// Public Enrollment Service (for enrollment links and wizard)
builder.Services.AddScoped<IPublicEnrollmentService, PublicEnrollmentService>();

// File Storage Service - Choose based on configuration
builder.Services.Configure<FileStorageSettings>(
    builder.Configuration.GetSection(FileStorageSettings.SectionName));

var fileStorageSettings = builder.Configuration
    .GetSection(FileStorageSettings.SectionName)
    .Get<FileStorageSettings>();

if (fileStorageSettings?.UseAzureStorage == true &&
    !string.IsNullOrEmpty(fileStorageSettings.AzureConnectionString))
{
    builder.Services.AddScoped<IFileStorageService, AzureBlobStorageService>();
}
else
{
    builder.Services.AddScoped<IFileStorageService, FileStorageService>();
}

// Configure eWay Payment Gateway (using HttpClient for .NET 9 compatibility)
builder.Services.Configure<EwaySettings>(
    builder.Configuration.GetSection(EwaySettings.SectionName));

var ewaySettings = builder.Configuration
    .GetSection(EwaySettings.SectionName)
    .Get<EwaySettings>();

if (ewaySettings != null && !string.IsNullOrEmpty(ewaySettings.ApiKey))
{
    // Register HttpClient for eWay API
    builder.Services.AddHttpClient("EwayClient");
    
    // Register Payment Gateway Service
    builder.Services.AddScoped<IPaymentGatewayService, PaymentGatewayService>();
}

// Configure Email (for OTP and notifications)
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEmailTestService, EmailTestService>();

// Add services to the container.
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();

//  Configure Swagger with proper settings
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Training Institute LMS API",
        Version = "v1",
        Description = "API for Training Institute Learning Management System"
    });
    // Resolve duplicate operation IDs (fixes Internal Server Error when generating swagger.json)
    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    // Avoid schema ID collisions for types with the same name in different namespaces
    options.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);
});

//  Add Controllers with camelCase JSON for frontend compatibility
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// Add CORS - configurable origins from appsettings, with predicate for dynamic origins
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? [
        "http://localhost:5173",
        "https://localhost:5173",
        "http://localhost:5174",
        "https://localhost:5174",
        "https://delightful-beach-0f6f2f100.4.azurestaticapps.net",
        "https://booking.safetytrainingacademy.edu.au",
        "https://safetytrainingacademy.edu.au",
        "https://safety-training-academy-api-dnfagvdpcee2e6gm.australiaeast-01.azurewebsites.net/",
            "https://safety-training-academy-api-dnfagvdpcee2e6gm.australiaeast-01.azurewebsites.net/api"
            // "
    ];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .SetIsOriginAllowed(origin =>
            {
                // Explicit check for booking origin (View PDF enrollment form page)
                if (string.Equals(origin, "https://safetytrainingacademy.edu.au", StringComparison.OrdinalIgnoreCase))
                    return true;

                // Allow any Azure Static Web Apps origin
                if (origin?.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase) == true)
                    return true;

                // Allow safetytrainingacademy.edu.au domain and subdomains
                if (origin?.EndsWith(".safetytrainingacademy.edu.au", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(origin, "https://safetytrainingacademy.edu.au", StringComparison.OrdinalIgnoreCase))
                    return true;

                // Allow localhost for development
                if (origin?.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) == true ||
                    origin?.StartsWith("https://localhost:", StringComparison.OrdinalIgnoreCase) == true)
                    return true;

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Apply pending migrations on startup (e.g. CompanyOrders.CompanyMobile, new tables)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TrainingLMSDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var pending = db.Database.GetPendingMigrations().ToList();
        if (pending.Count > 0)
        {
            logger.LogInformation("Applying {Count} pending migration(s): {Migrations}", pending.Count, string.Join(", ", pending));
            db.Database.Migrate();
            logger.LogInformation("Migrations applied successfully.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply migrations. The app will continue but database schema may be outdated.");
        throw;
    }

    // Alternative path: ensure CompanyMobile column exists via raw SQL (works even if migration was not in the bundle)
    try
    {
        const string ensureColumnSql = @"
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('CompanyOrders') AND name = 'CompanyMobile'
)
BEGIN
    ALTER TABLE CompanyOrders ADD CompanyMobile nvarchar(50) NULL;
END";
        db.Database.ExecuteSqlRaw(ensureColumnSql);
        logger.LogInformation("CompanyOrders.CompanyMobile column ensured (raw SQL).");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not ensure CompanyMobile column via raw SQL (table may not exist yet).");
    }
}

//  IMPORTANT: Swagger MUST come before UseCors and other middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Training Institute LMS API v1");
        options.RoutePrefix = string.Empty; 
    });
}

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

app.UseRouting();

// CORS - Use the built-in policy
app.UseCors("AllowReact");

// Authentication & Authorization - MUST be between UseRouting and MapControllers
app.UseAuthentication();
app.UseAuthorization();

// Map controllers 
app.MapControllers();

string[] summaries = ["Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.ExcludeFromDescription();

// test endpoint
app.MapGet("/api/test", () => new
{
    Message = "API is working!",
    Timestamp = DateTime.UtcNow,
    Environment = app.Environment.EnvironmentName
})
.WithName("TestEndpoint")
.ExcludeFromDescription();

// Map Aspire default endpoints (health checks, etc.)
app.MapDefaultEndpoints();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}