using Backend.DTOs.Application;
using Backend.Interfaces.ATS;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;
namespace Backend.Services.Applications;
public class ApplicationService : IApplicationService
{
    //reference variable
    private readonly IApplicationRepository _applicationRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IATSService _atsService;
    private readonly INotificationService _notificationService;
    private readonly IWebHostEnvironment _environment;
    private readonly IResumeAIService _resumeAIService;
    public ApplicationService(
        IApplicationRepository applicationRepository,
        IJobRepository jobRepository,
        IResumeRepository resumeRepository,
        IATSService atsService,
        IResumeAIService resumeAIService,
        INotificationService notificationService,
        IWebHostEnvironment environment)
    {
        _applicationRepository = applicationRepository;
        _jobRepository = jobRepository;
        _resumeRepository = resumeRepository;
        _atsService = atsService;
        _resumeAIService = resumeAIService;
        _notificationService = notificationService;
        _environment = environment;
    }
    // =====================================================
    // CANDIDATE - APPLY FOR JOB
    // =====================================================
    public async Task<ApplicationResponseDto> ApplyJobAsync(
        Guid userId,
        ApplyJobDto dto,
        CancellationToken cancellationToken)
    {
        var job =
            await _jobRepository.GetJobByIdAsync(
                dto.JobId,
                cancellationToken);
        if (job is null)
        {
            throw new KeyNotFoundException(
                "Job not found.");
        }
        if (job.Company is null)
        {
            throw new InvalidOperationException(
                "Company information for this job could not be found.");
        }
        if (job.Company.UserId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "Company user information for this job could not be found.");
        }
        if (!job.IsActive)
        {
            throw new InvalidOperationException(
                "This job is no longer active.");
        }
        if (job.LastDateToApply < DateTime.UtcNow)
        {
            throw new InvalidOperationException(
                "The application deadline has passed.");
        }
        var existingApplication =
            await _applicationRepository
                .GetApplicationByUserAndJobAsync(
                    userId,
                    dto.JobId,
                    cancellationToken);
        if (existingApplication is not null)
        {
            throw new InvalidOperationException(
                "You have already applied for this job.");
        }
        var resume =
            await _resumeRepository
                .GetResumeByIdAsync(
                    dto.ResumeId,
                    cancellationToken);
        if (resume is null)
        {
            throw new InvalidOperationException(
                "Please upload your resume before applying for a job.");
        }
        if (resume.UserId != userId)
        {
            throw new InvalidOperationException(
                "Selected resume does not belong to the current candidate.");
        }
        if (string.IsNullOrWhiteSpace(resume.FileName))
        {
            throw new InvalidOperationException(
                "Resume file information is missing.");
        }
        if (string.IsNullOrWhiteSpace(resume.FilePath))
        {
            throw new InvalidOperationException(
                "Resume file path is missing.");
        }
        if (dto.Skills is null || dto.Skills.Count == 0)
        {
            throw new InvalidOperationException(
                "Please select at least one skill.");
        }
        // =================================================
        // EXISTING DETERMINISTIC ATS
        // =================================================
        var atsBreakdown =
            _atsService.CalculateAdvancedATS(
                resume,
                job);
        // =================================================
        // EXISTING JOB-SPECIFIC AI ANALYSIS
        // =================================================
        var aiAnalysis =
            await _resumeAIService
                .AnalyzeResumeForJobAsync(
                    resume.ResumeText,
                    resume.ExtractedSkills,
                    job.Title,
                    job.Description,
                    job.Skills,
                    job.PreferredSkills,
                    job.EducationRequirements,
                    job.CertificationRequirements,
                    job.Experience,
                    cancellationToken);
        var matchingScore =
            Math.Round(
                (atsBreakdown.ATSScore * 0.70)
                +
                (aiAnalysis.ATSScore * 0.30),
                2);
        // =================================================
        // SKILLS
        // =================================================
        var skills =
            string.Join(
                ", ",
                dto.Skills
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x))
                    .Select(x =>
                        x.Trim())
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase));
        // =================================================
        // APPLICATION ID
        // =================================================
        var applicationId =
            Guid.NewGuid();
        // =================================================
        // IMMUTABLE RESUME SNAPSHOT
        // =================================================
        var applicationResumePath =
            await CreateApplicationResumeSnapshotAsync(
                applicationId,
                resume,
                cancellationToken);
        try
        {
            // =================================================
            // CREATE APPLICATION
            // =================================================
            var application =
                new JobApplication
                {
                    Id = applicationId,
                    UserId = userId,
                    JobId = job.Id,
                    Name = dto.Name.Trim(),
                    Email = dto.Email.Trim(),
                    Contact = dto.Contact.Trim(),
                    Qualification =
                        dto.Qualification.Trim(),
                    Course =
                        dto.Course.Trim(),
                    CollegeName =
                        dto.CollegeName.Trim(),
                    Skills = skills,
                    Experience =
                        dto.Experience,
                    Status = "Applied",
                    // =================================================
                    // EXISTING ATS
                    // =================================================
                    ATSScore =
                        matchingScore,
                    SkillsMatch =
                        atsBreakdown.SkillsMatch,
                    ExperienceMatch =
                        atsBreakdown.ExperienceMatch,
                    EducationMatch =
                        atsBreakdown.EducationMatch,
                    ProjectMatch =
                        atsBreakdown.ProjectMatch,
                    CertificationMatch =
                        atsBreakdown.CertificationMatch,
                    SummaryMatch =
                        atsBreakdown.SummaryMatch,
                    StructureMatch =
                        atsBreakdown.StructureMatch,
                    JobDescriptionMatch =
                        atsBreakdown.JobDescriptionMatch,
                    // =================================================
                    // AI JOB MATCH SCORE
                    // =================================================
                    //
                    // Generated only when Company clicks
                    // "Analyze with AI".
                    //
                    JobMatchScore = null,
                    AppliedAt =
                        DateTime.UtcNow,
                    // =================================================
                    // IMMUTABLE RESUME SNAPSHOT
                    // =================================================
                    ResumeId =
                        resume.Id,
                    ResumeFileName =
                        resume.FileName,
                    ResumeFilePath =
                        applicationResumePath,
                    ResumeText =
                        resume.ResumeText,
                    ResumeExtractedSkills =
                        resume.ExtractedSkills,
                    ResumeUploadedAt =
                        resume.UploadedAt
                };
            // =================================================
            // SAVE APPLICATION
            // =================================================
            await _applicationRepository
                .AddApplicationAsync(
                    application,
                    cancellationToken);
            await _applicationRepository
                .SaveChangesAsync(
                    cancellationToken);
            // =================================================
            // NOTIFY COMPANY
            // =================================================
            await _notificationService
                .NotifyApplicationSubmittedAsync(
                    job.Id,
                    userId,
                    matchingScore,
                    cancellationToken);
            // =================================================
            // NOTIFY CANDIDATE
            // =================================================
            await _notificationService
                .NotifyCandidateApplicationSubmittedAsync(
                    userId,
                    job.Id,
                    job.Title,
                    job.Company.CompanyName,
                    cancellationToken);
            return MapToResponse(
                application,
                job);
        }
        catch
        {
            DeleteApplicationResumeSnapshot(
                applicationResumePath);

            throw;
        }
    }
    // =====================================================
    // CREATE APPLICATION RESUME SNAPSHOT
    // =====================================================
    private async Task<string>
        CreateApplicationResumeSnapshotAsync(
            Guid applicationId,
            Resume resume,
            CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var webRootPath =
            _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
        }
        var relativeResumePath =
            resume.FilePath
                .TrimStart('/', '\\')
                .Replace(
                    '/',
                    Path.DirectorySeparatorChar)
                .Replace(
                    '\\',
                    Path.DirectorySeparatorChar);
        var sourcePath =
            Path.GetFullPath(
                Path.Combine(
                    webRootPath,
                    relativeResumePath));
        if (!File.Exists(sourcePath))
        {
            throw new InvalidOperationException(
                "The selected resume file is no longer available.");
        }
        var applicationResumeFolder =
            Path.Combine(
                webRootPath,
                "application-resumes");
        Directory.CreateDirectory(
            applicationResumeFolder);
        var extension =
            Path.GetExtension(
                resume.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension =
                Path.GetExtension(
                    sourcePath);
        }
        extension =
            extension.ToLowerInvariant();
        var applicationFileName =
            $"{applicationId:N}{extension}";
        var destinationPath =
            Path.Combine(
                applicationResumeFolder,
                applicationFileName);
        await using var sourceStream =
            new FileStream(
                sourcePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                useAsync: true);
        await using var destinationStream =
            new FileStream(
                destinationPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true);
        await sourceStream.CopyToAsync(
            destinationStream,
            cancellationToken);
        if (!File.Exists(destinationPath))
        {
            throw new InvalidOperationException(
                "Application resume snapshot could not be created.");
        }
        return
            $"application-resumes/{applicationFileName}";
    }
    // =====================================================
    // DELETE APPLICATION RESUME SNAPSHOT
    // =====================================================
    private void DeleteApplicationResumeSnapshot(
        string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return;
        }
        var webRootPath =
            _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
        }
        var normalizedPath =
            relativePath
                .TrimStart('/', '\\')
                .Replace(
                    '/',
                    Path.DirectorySeparatorChar)
                .Replace(
                    '\\',
                    Path.DirectorySeparatorChar);
        var fullPath =
            Path.Combine(
                webRootPath,
                normalizedPath);
        try
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch
        {
            // Do not hide original exception.
        }
    }
    // =====================================================
    // CANDIDATE - MY APPLICATIONS
    // =====================================================
    public async Task<
        IEnumerable<ApplicationResponseDto>>
        GetApplicationsByUserAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        var applications =
            await _applicationRepository
                .GetApplicationsByUserAsync(
                    userId,
                    cancellationToken);
        return applications.Select(
            application =>
                MapToResponse(
                    application,
                    application.Job));
    }
    // =====================================================
    // COMPANY - JOB APPLICATIONS
    // =====================================================
    public async Task<
        IEnumerable<ApplicationResponseDto>>
        GetApplicationsByJobAsync(
            Guid companyId,
            Guid jobId,
            CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "Invalid company ID.");
        }
        if (jobId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "Invalid job ID.");
        }
        var applications =
            await _applicationRepository
                .GetApplicationsByJobAsync(
                    companyId,
                    jobId,
                    cancellationToken);
        return applications.Select(
            application =>
                MapToResponse(
                    application,
                    application.Job));
    }
    // =====================================================
    // COMPANY - UPDATE STATUS
    // =====================================================
    public async Task<
        ApplicationResponseDto?>
        UpdateApplicationStatusAsync(
            Guid companyId,
            Guid applicationId,
            UpdateApplicationStatusDto dto,
            CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
        {
            return null;
        }
        if (applicationId == Guid.Empty)
        {
            return null;
        }
        var application =
            await _applicationRepository
                .GetCompanyApplicationByIdAsync(
                    companyId,
                    applicationId,
                    cancellationToken);
        if (application is null)
        {
            return null;
        }
        var status =
            dto.Status.ToString();
        if (application.Status == status)
        {
            return MapToResponse(
                application,
                application.Job);
        }
        application.Status =
            status;
        await _applicationRepository
            .SaveChangesAsync(
                cancellationToken);
        await _notificationService
            .NotifyCandidateApplicationStatusChangedAsync(
                application.UserId,
                application.JobId,
                application.Job.Title,
                application.Job.Company
                    ?.CompanyName ??
                    "the company",
                status,
                cancellationToken);
        return MapToResponse(
            application,
            application.Job);
    }
    // =====================================================
    // MAPPING
    // =====================================================
    private static ApplicationResponseDto
        MapToResponse(
            JobApplication application,
            Job job)
    {
        return new ApplicationResponseDto
        {
            Id =
                application.Id,
            UserId =
                application.UserId,
            JobId =
                application.JobId,
            JobTitle =
                job.Title,
            CompanyName =
                job.Company?.CompanyName ??
                string.Empty,
            Name =
                application.Name,
            Email =
                application.Email,
            Contact =
                application.Contact,
            Qualification =
                application.Qualification,
            Course =
                application.Course,
            CollegeName =
                application.CollegeName,
            Skills =
                ParseSkills(
                    application.Skills),
            Experience =
                application.Experience,
            Status =
                application.Status,
            // =================================================
            // EXISTING ATS
            // =================================================
            ATSScore =
                application.ATSScore,
            SkillsMatch =
                application.SkillsMatch,
            ExperienceMatch =
                application.ExperienceMatch,
            EducationMatch =
                application.EducationMatch,
            SummaryMatch =
                application.SummaryMatch,
            StructureMatch =
                application.StructureMatch,
            JobDescriptionMatch =
                application.JobDescriptionMatch,
            ProjectMatch =
                application.ProjectMatch,
            CertificationMatch =
                application.CertificationMatch,
            // =================================================
            // NEW AI JOB MATCH SCORE
            // =================================================
            JobMatchScore =
                application.JobMatchScore,
            AppliedAt =
                application.AppliedAt,
            // =================================================
            // RESUME SNAPSHOT
            // =================================================

            ResumeId =
                application.ResumeId,

            ResumeFileName =
                application.ResumeFileName,

            ResumeUrl =
                application.ResumeFilePath
        };
    }

    // =====================================================
    // PARSE SKILLS
    // =====================================================

    private static List<string>
        ParseSkills(
            string? skills)
    {
        if (string.IsNullOrWhiteSpace(skills))
        {
            return new List<string>();
        }

        return skills
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries)
            .Select(
                x => x.Trim())
            .Where(
                x =>
                    !string.IsNullOrWhiteSpace(x))
            .Distinct(
                StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
