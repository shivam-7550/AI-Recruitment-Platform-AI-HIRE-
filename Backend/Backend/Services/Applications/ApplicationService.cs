using Backend.DTOs.Application;
using Backend.Interfaces.ATS;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Applications;

public class ApplicationService : IApplicationService
{
    private readonly IApplicationRepository _applicationRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IATSService _atsService;
    private readonly INotificationService _notificationService;

    public ApplicationService(
        IApplicationRepository applicationRepository,
        IJobRepository jobRepository,
        IResumeRepository resumeRepository,
        IATSService atsService,
        INotificationService notificationService)
    {
        _applicationRepository =
            applicationRepository;

        _jobRepository =
            jobRepository;

        _resumeRepository =
            resumeRepository;

        _atsService =
            atsService;

        _notificationService =
            notificationService;
    }

    // =====================================================
    // CANDIDATE - APPLY FOR JOB
    // =====================================================

    public async Task<ApplicationResponseDto>
        ApplyJobAsync(
            Guid userId,
            ApplyJobDto dto,
            CancellationToken cancellationToken)
    {
        // -------------------------------------------------
        // Validate Job
        // -------------------------------------------------

        var job =
            await _jobRepository
                .GetJobByIdAsync(
                    dto.JobId,
                    cancellationToken);

        if (job is null)
        {
            throw new KeyNotFoundException(
                "Job not found.");
        }

        // -------------------------------------------------
        // Validate Company
        // -------------------------------------------------

        if (job.Company is null)
        {
            throw new InvalidOperationException(
                "Company information for this job could not be found.");
        }

        if (
            job.Company.UserId ==
            Guid.Empty
        )
        {
            throw new InvalidOperationException(
                "Company user information for this job could not be found.");
        }

        // -------------------------------------------------
        // Active Job
        // -------------------------------------------------

        if (!job.IsActive)
        {
            throw new InvalidOperationException(
                "This job is no longer active.");
        }

        // -------------------------------------------------
        // Deadline
        // -------------------------------------------------

        if (
            job.LastDateToApply <
            DateTime.UtcNow
        )
        {
            throw new InvalidOperationException(
                "The application deadline has passed.");
        }

        // -------------------------------------------------
        // Duplicate Application
        // -------------------------------------------------

        var existingApplication =
            await _applicationRepository
                .GetApplicationByUserAndJobAsync(
                    userId,
                    dto.JobId,
                    cancellationToken);

        if (
            existingApplication is not null
        )
        {
            throw new InvalidOperationException(
                "You have already applied for this job.");
        }

        // -------------------------------------------------
        // Resume
        // -------------------------------------------------

        var resume =
            await _resumeRepository
                .GetResumeByUserIdAsync(
                    userId,
                    cancellationToken);

        if (resume is null)
        {
            throw new InvalidOperationException(
                "Please upload your resume before applying for a job.");
        }

        // -------------------------------------------------
        // Skills
        // -------------------------------------------------

        if (
            dto.Skills is null ||
            dto.Skills.Count == 0
        )
        {
            throw new InvalidOperationException(
                "Please select at least one skill.");
        }

        // -------------------------------------------------
        // ATS Score
        // -------------------------------------------------

        var matchingScore =
            _atsService
                .CalculateJobMatchScore(
                    resume,
                    job);

        // -------------------------------------------------
        // Skills String
        // -------------------------------------------------

        var skills =
            string.Join(
                ", ",
                dto.Skills
                    .Where(
                        x =>
                            !string.IsNullOrWhiteSpace(
                                x))
                    .Select(
                        x =>
                            x.Trim())
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase));

        // -------------------------------------------------
        // Create Application
        // -------------------------------------------------

        var application =
            new JobApplication
            {
                Id =
                    Guid.NewGuid(),

                UserId =
                    userId,

                JobId =
                    job.Id,

                Name =
                    dto.Name.Trim(),

                Email =
                    dto.Email.Trim(),

                Contact =
                    dto.Contact.Trim(),

                Qualification =
                    dto.Qualification.Trim(),

                Course =
                    dto.Course.Trim(),

                CollegeName =
                    dto.CollegeName.Trim(),

                Skills =
                    skills,

                Experience =
                    dto.Experience,

                Status =
                    "Applied",

                ATSScore =
                    matchingScore,

                AppliedAt =
                    DateTime.UtcNow,

                ResumeId =
                    resume.Id,

                Resume =
                    resume
            };

        // -------------------------------------------------
        // Save
        // -------------------------------------------------

        await _applicationRepository
            .AddApplicationAsync(
                application,
                cancellationToken);

        await _applicationRepository
            .SaveChangesAsync(
                cancellationToken);

        // -------------------------------------------------
        // Notify Company
        // -------------------------------------------------

        await _notificationService
            .NotifyApplicationSubmittedAsync(
                job.Id,
                userId,
                matchingScore,
                cancellationToken);

        // -------------------------------------------------
        // Notify Candidate
        // -------------------------------------------------

        await _notificationService
            .NotifyCandidateApplicationSubmittedAsync(
                userId,
                job.Id,
                job.Title,
                job.Company.CompanyName,
                cancellationToken);

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return MapToResponse(
            application,
            job);
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
        if (
            companyId ==
            Guid.Empty
        )
        {
            throw new InvalidOperationException(
                "Invalid company ID.");
        }

        if (
            jobId ==
            Guid.Empty
        )
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
        if (
            companyId ==
            Guid.Empty
        )
        {
            return null;
        }

        if (
            applicationId ==
            Guid.Empty
        )
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

        if (
            application.Status ==
            status
        )
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

    private static
        ApplicationResponseDto
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
                job.Company
                    ?.CompanyName ??
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

            ATSScore =
                application.ATSScore,

            AppliedAt =
                application.AppliedAt,

            ResumeId =
                application.Resume?.Id ??
                application.ResumeId,

            ResumeFileName =
                application.Resume?.FileName,

            ResumeUrl =
                application.Resume?.FilePath
        };
    }

    // =====================================================
    // PARSE SKILLS
    // =====================================================

    private static List<string>
        ParseSkills(
            string? skills)
    {
        if (
            string.IsNullOrWhiteSpace(
                skills)
        )
        {
            return new List<string>();
        }

        return skills
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries)
            .Select(
                x =>
                    x.Trim())
            .Where(
                x =>
                    !string.IsNullOrWhiteSpace(
                        x))
            .Distinct(
                StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}