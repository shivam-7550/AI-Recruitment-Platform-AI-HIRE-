using Backend.Constants;
using Backend.DTOs.Interview;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Interviews;

public sealed class InterviewService : IInterviewService
{
    private readonly IInterviewRepository _repository;

    public InterviewService(
        IInterviewRepository repository)
    {
        _repository = repository;
    }

    public async Task<InterviewResponseDto> CreateAsync(
        CreateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        var interview = new Interview
        {
            Id = Guid.NewGuid(),

            ApplicationId = dto.ApplicationId,

            Round = dto.Round,

            InterviewType = dto.InterviewType,

            ScheduledAt = dto.ScheduledAt,

            DurationMinutes = dto.DurationMinutes,

            MeetingLink = dto.MeetingLink,

            Location = dto.Location,

            Instructions = dto.Instructions,

            Status = InterviewStatus.Scheduled,

            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(
            interview,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return await GetByIdAsync(
            interview.Id,
            cancellationToken)
            ?? throw new Exception(
                "Interview could not be created.");
    }

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

    public async Task<IEnumerable<InterviewResponseDto>>
        GetCompanyInterviewsAsync(
            Guid companyId,
            CancellationToken cancellationToken)
    {
        var interviews =
            await _repository.GetByCompanyIdAsync(
                companyId,
                cancellationToken);

        return interviews.Select(Map);
    }

    public async Task<IEnumerable<InterviewResponseDto>>
        GetCandidateInterviewsAsync(
            Guid candidateId,
            CancellationToken cancellationToken)
    {
        var interviews =
            await _repository.GetByCandidateIdAsync(
                candidateId,
                cancellationToken);

        return interviews.Select(Map);
    }

    public async Task<bool> UpdateAsync(
        Guid interviewId,
        UpdateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        var interview =
            await _repository.GetByIdAsync(
                interviewId,
                cancellationToken);

        if (interview == null)
        {
            return false;
        }

        interview.Round =
            dto.Round;

        interview.InterviewType =
            dto.InterviewType;

        interview.ScheduledAt =
            dto.ScheduledAt;

        interview.DurationMinutes =
            dto.DurationMinutes;

        interview.MeetingLink =
            dto.MeetingLink;

        interview.Location =
            dto.Location;

        interview.Instructions =
            dto.Instructions;

        interview.UpdatedAt =
            DateTime.UtcNow;

        _repository.Update(interview);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    private static InterviewResponseDto Map(
        Interview interview)
    {
        return new InterviewResponseDto
        {
            Id = interview.Id,

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