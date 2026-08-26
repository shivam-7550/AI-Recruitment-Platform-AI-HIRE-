using Backend.DTOs.Interview;

namespace Backend.Interfaces.Services;

public interface IInterviewService
{
    Task<InterviewResponseDto> CreateAsync(
        CreateInterviewDto dto,
        CancellationToken cancellationToken);

    Task<InterviewResponseDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<IEnumerable<InterviewResponseDto>> GetCompanyInterviewsAsync(
        Guid companyId,
        CancellationToken cancellationToken);

    Task<IEnumerable<InterviewResponseDto>> GetCandidateInterviewsAsync(
        Guid candidateId,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        Guid interviewId,
        UpdateInterviewDto dto,
        CancellationToken cancellationToken);
}