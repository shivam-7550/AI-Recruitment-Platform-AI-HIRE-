
using Backend.Data;
using Backend.Helpers;
using Backend.Interfaces.ATS;
using Backend.Interfaces.Auth;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Interfaces.Utilities;
using Backend.Repositories;
using Backend.Services;
using Backend.Services.Applications;
using Backend.Services.ATS;
using Backend.Services.Auth;
using Backend.Services.Companies;
using Backend.Services.Interviews;
using Backend.Services.Jobs;
using Backend.Services.Notifications;
using Backend.Services.Resumes;
using Backend.Services.SavedJobs;
using Backend.Services.Users;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using System.Text;

var builder = WebApplication.CreateBuilder(args);


// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();


// ============================================================
// HTTP CLIENT
// ============================================================

// Used by ResumeAIService / Gemini integration
builder.Services.AddHttpClient();


// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type = SecuritySchemeType.Http,

            Scheme = "Bearer",

            BearerFormat = "JWT",

            In = ParameterLocation.Header,

            Description =
                "Enter JWT Token like: Bearer eyJhbGciOiJIUzI1NiIs..."
        });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference(
                    "Bearer",
                    document),

                new List<string>()
            }
        });
});


// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactPolicy",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173")

                .AllowAnyHeader()

                .AllowAnyMethod()

                .AllowCredentials();
        });
});


// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
    {
        options.UseSqlServer(
            builder.Configuration.GetConnectionString(
                "DefaultConnection"),

            sqlOptions =>
            {
                sqlOptions.CommandTimeout(60);

                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,

                    maxRetryDelay:
                        TimeSpan.FromSeconds(5),

                    errorNumbersToAdd:
                        null);
            });
    });


// ============================================================
// JWT AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)

    .AddJwtBearer(
        options =>
        {
            options.TokenValidationParameters =
                new TokenValidationParameters
                {
                    ValidateIssuer = true,

                    ValidateAudience = true,

                    ValidateLifetime = true,

                    ValidateIssuerSigningKey = true,

                    ValidIssuer =
                        builder.Configuration[
                            "Jwt:Issuer"],

                    ValidAudience =
                        builder.Configuration[
                            "Jwt:Audience"],

                    IssuerSigningKey =
                        new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(
                                builder.Configuration[
                                    "Jwt:Key"]!
                            )
                        ),

                    ClockSkew =
                        TimeSpan.Zero
                };
        });


// ============================================================
// AUTHORIZATION
// ============================================================

builder.Services.AddAuthorization();


// ============================================================
// DEPENDENCY INJECTION
// ============================================================


// ------------------------------------------------------------
// USER
// ------------------------------------------------------------

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();


// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    IJwtTokenGenerator,
    JwtTokenGenerator>();

builder.Services.AddScoped<
    IPasswordHasher,
    PasswordHasher>();

// ------------------------------------------------------------
// JOB
// ------------------------------------------------------------

builder.Services.AddScoped<
    IJobRepository,
    JobRepository>();

builder.Services.AddScoped<
    IJobService,
    JobService>();


// ------------------------------------------------------------
// COMPANY
// ------------------------------------------------------------

builder.Services.AddScoped<
    ICompanyRepository,
    CompanyRepository>();

builder.Services.AddScoped<
    ICompanyService,
    CompanyService>();


// ------------------------------------------------------------
// INTERVIEW
// ------------------------------------------------------------

builder.Services.AddScoped<
    IInterviewRepository,
    InterviewRepository>();

builder.Services.AddScoped<
    IInterviewService,
    InterviewService>();


// ------------------------------------------------------------
// APPLICATION
// ------------------------------------------------------------

builder.Services.AddScoped<
    IApplicationRepository,
    ApplicationRepository>();

builder.Services.AddScoped<
    IApplicationService,
    ApplicationService>();


// ------------------------------------------------------------
// RESUME
// ------------------------------------------------------------

builder.Services.AddScoped<
    IResumeRepository,
    ResumeRepository>();

builder.Services.AddScoped<
    IResumeService,
    ResumeService>();


// ------------------------------------------------------------
// GEMINI / AI RESUME SERVICE
// ------------------------------------------------------------

builder.Services.AddHttpClient<
    IResumeAIService,
    ResumeAIService>();


// ------------------------------------------------------------
// RESUME HELPERS
// ------------------------------------------------------------

builder.Services.AddScoped<
    IPdfParser,
    PdfParser>();

builder.Services.AddScoped<
    ISkillExtractor,
    SkillExtractor>();


// ------------------------------------------------------------
// ATS
// ------------------------------------------------------------

builder.Services.AddScoped<
    IATSService,
    ATSService>();


// ------------------------------------------------------------
// NOTIFICATION
// ------------------------------------------------------------

// Required for:
// 1. Candidate interview notifications
// 2. Admin interview notifications
// 3. Application notifications
// 4. Job notifications
// 5. Company approval notifications

builder.Services.AddScoped<
    INotificationRepository,
    NotificationRepository>();

builder.Services.AddScoped<
    INotificationService,
    NotificationService>();


// ------------------------------------------------------------
// USER PROFILE
// ------------------------------------------------------------

builder.Services.AddScoped<
    IUserProfileService,
    UserProfileService>();


// ------------------------------------------------------------
// SAVED JOB
// ------------------------------------------------------------

builder.Services.AddScoped<
    ISavedJobService,
    SavedJobService>();


// ------------------------------------------------------------
// USER SETTINGS
// ------------------------------------------------------------

builder.Services.AddScoped<
    IUserSettingsRepository,
    UserSettingsRepository>();

builder.Services.AddScoped<
    IUserSettingsService,
    UserSettingsService>();


// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// DATABASE MIGRATION
// ============================================================

if (app.Environment.IsDevelopment())
{
    using var migrationScope =
        app.Services.CreateScope();

    var migrationDbContext =
        migrationScope.ServiceProvider
            .GetRequiredService<
                ApplicationDbContext>();

    await migrationDbContext
        .Database
        .MigrateAsync();


    // ========================================================
    // DEVELOPMENT ADMIN
    // ========================================================

    var adminEmail =
        app.Configuration[
            "DevelopmentAdmin:Email"]
            ?.Trim()
            .ToLowerInvariant();

    if (!string.IsNullOrWhiteSpace(
            adminEmail))
    {
        using var adminScope =
            app.Services.CreateScope();

        var dbContext =
            adminScope.ServiceProvider
                .GetRequiredService<
                    ApplicationDbContext>();

        var admin =
            await dbContext.Users
                .FirstOrDefaultAsync(
                    user =>
                        user.Email == adminEmail);

        if (admin != null &&
            admin.Role !=
                Backend.Constants.Roles.Admin)
        {
            admin.Role =
                Backend.Constants.Roles.Admin;

            admin.UpdatedAt =
                DateTime.UtcNow;

            await dbContext.SaveChangesAsync();
        }
    }
}


// ============================================================
// SWAGGER
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ============================================================
// EXCEPTION MIDDLEWARE
// ============================================================

app.UseMiddleware<
    Backend.Middleware.ExceptionMiddleware>();


// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();


// ============================================================
// STATIC FILES
// ============================================================

app.UseStaticFiles();


// ============================================================
// CORS
// ============================================================

app.UseCors("ReactPolicy");


// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// RUN
// ============================================================

app.Run();


