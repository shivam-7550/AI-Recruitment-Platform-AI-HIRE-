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
// Controllers
// ============================================================

builder.Services.AddControllers();


// ============================================================
// Swagger
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
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// ============================================================
// Database
// ============================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.CommandTimeout(60);

            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        });
});


// ============================================================
// JWT Authentication
// ============================================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration["Jwt:Key"]!
                        )
                    )
            };
    });


// ============================================================
// Authorization
// ============================================================

builder.Services.AddAuthorization();


// ============================================================
// Dependency Injection
// ============================================================

// -----------------------------
// User
// -----------------------------

builder.Services.AddScoped<IUserRepository, UserRepository>();


// -----------------------------
// Authentication
// -----------------------------

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<PasswordHasher>();

// -----------------------------
// Job
// -----------------------------

builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IJobService, JobService>();


// -----------------------------
// Company
// -----------------------------

builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<ICompanyService, CompanyService>();

// -----------------------------
// Interview
// -----------------------------

builder.Services.AddScoped<IInterviewRepository, InterviewRepository>();
builder.Services.AddScoped<IInterviewService, InterviewService>();


// -----------------------------
// Application
// -----------------------------

builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();


// -----------------------------
// Resume
// -----------------------------

builder.Services.AddScoped<IResumeRepository, ResumeRepository>();
builder.Services.AddScoped<IResumeService, ResumeService>();


// -----------------------------
// Resume Helpers
// -----------------------------

builder.Services.AddScoped<IPdfParser, PdfParser>();
builder.Services.AddScoped<ISkillExtractor, SkillExtractor>();


// -----------------------------
// ATS
// -----------------------------

builder.Services.AddScoped<IATSService, ATSService>();


// -----------------------------
// Notification
// -----------------------------

builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();


// -----------------------------
// User Profile
// -----------------------------

builder.Services.AddScoped<IUserProfileService, UserProfileService>();


// -----------------------------
// Saved Jobs
// -----------------------------

builder.Services.AddScoped<ISavedJobService, SavedJobService>();


builder.Services.AddScoped<IUserSettingsRepository, UserSettingsRepository>();

builder.Services.AddScoped<IUserSettingsService, UserSettingsService>();


// ============================================================
// Build Application
// ============================================================

var app = builder.Build();


// ============================================================
// Development Database Migration
// ============================================================

if (app.Environment.IsDevelopment())
{
    using var migrationScope = app.Services.CreateScope();

    var migrationDbContext =
        migrationScope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

    await migrationDbContext.Database.MigrateAsync();


    // ========================================================
    // Promote Development Admin
    // ========================================================

    var adminEmail =
        app.Configuration["DevelopmentAdmin:Email"]
            ?.Trim()
            .ToLowerInvariant();

    if (!string.IsNullOrWhiteSpace(adminEmail))
    {
        using var scope = app.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var admin =
            await dbContext.Users
                .FirstOrDefaultAsync(
                    user => user.Email == adminEmail);

        if (admin != null &&
            admin.Role != Backend.Constants.Roles.Admin)
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
// Swagger
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ============================================================
// Exception Middleware
// ============================================================

app.UseMiddleware<Backend.Middleware.ExceptionMiddleware>();


// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();


// ============================================================
// Static Files
// ============================================================

app.UseStaticFiles();


// ============================================================
// CORS
// ============================================================

app.UseCors("ReactPolicy");


// ============================================================
// Authentication
// ============================================================

app.UseAuthentication();


// ============================================================
// Authorization
// ============================================================

app.UseAuthorization();


// ============================================================
// Controllers
// ============================================================

app.MapControllers();


// ============================================================
// Run
// ============================================================

app.Run();