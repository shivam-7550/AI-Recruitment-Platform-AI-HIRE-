using Backend.Constants;
using Backend.DTOs.Interview;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Interviews;

public sealed class InterviewService : IInterviewService
{
    private readonly IInterviewRepository _repository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly INotificationService _notificationService;

    public InterviewService(
        IInterviewRepository repository,
        IApplicationRepository applicationRepository,
        INotificationService notificationService)
    {
        _repository =
            repository;

        _applicationRepository =
            applicationRepository;

        _notificationService =
            notificationService;
    }

    // ==========================================
    // Create Interview
    // ==========================================

    public async Task<InterviewResponseDto> CreateAsync(
        CreateInterviewDto dto,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // Validate Company
        // ==========================================

        if (companyId == Guid.Empty)
        {
            throw new UnauthorizedAccessException(
                "Invalid company ID.");
        }

        // ==========================================
        // Validate Application
        // ==========================================

        var application =
            await _applicationRepository
                .GetCompanyApplicationByIdAsync(
                    companyId,
                    dto.ApplicationId,
                    cancellationToken);

        if (application == null)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to schedule an interview for this application.");
        }

        // ==========================================
        // Validate Job
        // ==========================================

        if (application.Job == null)
        {
            throw new InvalidOperationException(
                "Job information could not be found for this application.");
        }

        // ==========================================
        // Validate Company
        // ==========================================

        if (application.Job.Company == null)
        {
            throw new InvalidOperationException(
                "Company information could not be found for this job.");
        }

        // ==========================================
        // Validate Candidate
        // ==========================================

        if (application.UserId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "Candidate information could not be found.");
        }

        // ==========================================
        // Create Interview
        // ==========================================

        var interview =
            new Interview
            {
                Id =
                    Guid.NewGuid(),

                ApplicationId =
                    dto.ApplicationId,

                Round =
                    dto.Round?.Trim() ??
                    string.Empty,

                InterviewType =
                    dto.InterviewType?.Trim() ??
                    string.Empty,

                ScheduledAt =
                    dto.ScheduledAt,

                DurationMinutes =
                    dto.DurationMinutes,

                MeetingLink =
                    string.IsNullOrWhiteSpace(
                        dto.MeetingLink)
                        ? null
                        : dto.MeetingLink.Trim(),

                Location =
                    string.IsNullOrWhiteSpace(
                        dto.Location)
                        ? null
                        : dto.Location.Trim(),

                Instructions =
                    string.IsNullOrWhiteSpace(
                        dto.Instructions)
                        ? null
                        : dto.Instructions.Trim(),

                Status =
                    InterviewStatus.Scheduled,

                CreatedAt =
                    DateTime.UtcNow
            };

        // ==========================================
        // Application Status Sync
        // ==========================================

        application.Status =
            ApplicationStatus.Interview.ToString();

        // ==========================================
        // Save Interview
        // ==========================================

        await _repository.AddAsync(
            interview,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);

        // ==========================================
        // Candidate Information
        // ==========================================

        var candidateName =
            string.IsNullOrWhiteSpace(
                application.Name)
                ? "Candidate"
                : application.Name.Trim();

        var candidateUserId =
            application.UserId;

        var jobId =
            application.JobId;

        var jobTitle =
            application.Job.Title;

        var companyName =
            application.Job.Company.CompanyName;

        // ==========================================
        // Notify Candidate
        // ==========================================

        await _notificationService
            .NotifyCandidateInterviewScheduledAsync(
                candidateUserId,
                application.Id,
                jobId,
                candidateName,
                jobTitle,
                companyName,
                interview.ScheduledAt,
                interview.InterviewType,
                interview.MeetingLink,
                cancellationToken);

        // ==========================================
        // Notify Admins
        // ==========================================

        await _notificationService
            .NotifyAdminsInterviewScheduledAsync(
                candidateUserId,
                application.Id,
                jobId,
                candidateName,
                jobTitle,
                companyName,
                interview.ScheduledAt,
                interview.InterviewType,
                interview.MeetingLink,
                cancellationToken);

        // ==========================================
        // Get Created Interview
        // ==========================================

        return await GetByIdAsync(
            interview.Id,
            cancellationToken)
            ?? throw new Exception(
                "Interview could not be created.");
    }

    // ==========================================
    // Get By Id
    // ==========================================

    public async Task<InterviewResponseDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var interview =
            await _repository.GetByIdAsync(
                id,
                cancellationToken);

        if (interview == null)
        {
            return null;
        }

        return Map(interview);
    }

    // ==========================================
    // Get By Id - Company
    // ==========================================

    public async Task<InterviewResponseDto?>
        GetForCompanyAsync(
            Guid interviewId,
            Guid companyId,
            CancellationToken cancellationToken)
    {
        var exists =
            await _repository
                .ExistsForCompanyAsync(
                    interviewId,
                    companyId,
                    cancellationToken);

        if (!exists)
        {
            return null;
        }

        return await GetByIdAsync(
            interviewId,
            cancellationToken);
    }

    // ==========================================
    // Get By Id - Candidate
    // ==========================================

    public async Task<InterviewResponseDto?>
        GetForCandidateAsync(
            Guid interviewId,
            Guid candidateId,
            CancellationToken cancellationToken)
    {
        var exists =
            await _repository
                .ExistsForCandidateAsync(
                    interviewId,
                    candidateId,
                    cancellationToken);

        if (!exists)
        {
            return null;
        }

        return await GetByIdAsync(
            interviewId,
            cancellationToken);
    }

    // ==========================================
    // Get Company Interviews
    // ==========================================

    public async Task<IEnumerable<InterviewResponseDto>>
        GetCompanyInterviewsAsync(
            Guid companyId,
            CancellationToken cancellationToken)
    {
        var interviews =
            await _repository
                .GetByCompanyIdAsync(
                    companyId,
                    cancellationToken);

        return interviews.Select(Map);
    }

    // ==========================================
    // Get Candidate Interviews
    // ==========================================

    public async Task<IEnumerable<InterviewResponseDto>>
        GetCandidateInterviewsAsync(
            Guid candidateId,
            CancellationToken cancellationToken)
    {
        var interviews =
            await _repository
                .GetByCandidateIdAsync(
                    candidateId,
                    cancellationToken);

        return interviews.Select(Map);
    }

    // ==========================================
    // Update Interview
    // ==========================================

    public async Task<bool> UpdateAsync(
        Guid interviewId,
        UpdateInterviewDto dto,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // Verify Company Ownership
        // ==========================================

        var exists =
            await _repository
                .ExistsForCompanyAsync(
                    interviewId,
                    companyId,
                    cancellationToken);

        if (!exists)
        {
            return false;
        }

        // ==========================================
        // Get Interview
        // ==========================================

        var interview =
            await _repository
                .GetByIdAsync(
                    interviewId,
                    cancellationToken);

        if (interview == null)
        {
            return false;
        }

        // ==========================================
        // Update Details
        // ==========================================

        interview.Round =
            dto.Round?.Trim() ??
            string.Empty;

        interview.InterviewType =
            dto.InterviewType?.Trim() ??
            string.Empty;

        interview.ScheduledAt =
            dto.ScheduledAt;

        interview.DurationMinutes =
            dto.DurationMinutes;

        interview.MeetingLink =
            string.IsNullOrWhiteSpace(
                dto.MeetingLink)
                ? null
                : dto.MeetingLink.Trim();

        interview.Location =
            string.IsNullOrWhiteSpace(
                dto.Location)
                ? null
                : dto.Location.Trim();

        interview.Instructions =
            string.IsNullOrWhiteSpace(
                dto.Instructions)
                ? null
                : dto.Instructions.Trim();

        interview.UpdatedAt =
            DateTime.UtcNow;

        _repository.Update(
            interview);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    // ==========================================
    // Update Interview Status
    // ==========================================

    public async Task<bool> UpdateStatusAsync(
        Guid interviewId,
        string status,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var interview =
            await _repository
                .GetByIdAsync(
                    interviewId,
                    cancellationToken);

        if (interview == null)
        {
            return false;
        }

        // ==========================================
        // Verify Company Ownership
        // ==========================================

        if (interview.Application.Job.CompanyId !=
            companyId)
        {
            return false;
        }

        // ==========================================
        // Validate Status
        // ==========================================

        if (!Enum.TryParse<InterviewStatus>(
                status,
                true,
                out var interviewStatus))
        {
            return false;
        }

        if (!Enum.IsDefined(
                typeof(InterviewStatus),
                interviewStatus))
        {
            return false;
        }

        // ==========================================
        // Update Status
        // ==========================================

        interview.Status =
            interviewStatus;

        interview.UpdatedAt =
            DateTime.UtcNow;

        _repository.Update(
            interview);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    // ==========================================
    // Delete Interview
    // ==========================================

    public async Task<bool> DeleteAsync(
        Guid interviewId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var interview =
            await _repository
                .GetByIdAsync(
                    interviewId,
                    cancellationToken);

        if (interview == null)
        {
            return false;
        }

        // ==========================================
        // Verify Company Ownership
        // ==========================================

        if (interview.Application.Job.CompanyId !=
            companyId)
        {
            return false;
        }

        // ==========================================
        // Delete Interview
        // ==========================================

        _repository.Delete(
            interview);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    // ==========================================
    // Mapping
    // ==========================================

    private static InterviewResponseDto Map(
        Interview interview)
    {
        return new InterviewResponseDto
        {
            Id =
                interview.Id,

            ApplicationId =
                interview.ApplicationId,

            CandidateId =
                interview.Application.UserId,

            CandidateName =
                interview.Application.Name,

            CandidateEmail =
                interview.Application.Email,

            JobId =
                interview.Application.JobId,

            JobTitle =
                interview.Application.Job.Title,

            Round =
                interview.Round,

            InterviewType =
                interview.InterviewType,

            ScheduledAt =
                interview.ScheduledAt,

            DurationMinutes =
                interview.DurationMinutes,

            MeetingLink =
                interview.MeetingLink,

            Location =
                interview.Location,

            Instructions =
                interview.Instructions,

            Status =
                interview.Status.ToString(),

            CreatedAt =
                interview.CreatedAt,

            UpdatedAt =
                interview.UpdatedAt
        };
    }
}