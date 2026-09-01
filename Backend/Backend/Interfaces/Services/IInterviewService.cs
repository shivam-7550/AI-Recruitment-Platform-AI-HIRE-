using Backend.DTOs.Interview;

namespace Backend.Interfaces.Services;

public interface IInterviewService
{
    // ==========================================
    // Create
    // ==========================================

    Task<InterviewResponseDto> CreateAsync(
        CreateInterviewDto dto,
        Guid companyId,
        CancellationToken cancellationToken);

    // ==========================================
    // Get By Id
    // ==========================================

    Task<InterviewResponseDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    // ==========================================
    // Get By Id - Company
    // ==========================================

    Task<InterviewResponseDto?> GetForCompanyAsync(
        Guid interviewId,
        Guid companyId,
        CancellationToken cancellationToken);

    // ==========================================
    // Get By Id - Candidate
    // ==========================================

    Task<InterviewResponseDto?> GetForCandidateAsync(
        Guid interviewId,
        Guid candidateId,
        CancellationToken cancellationToken);

    // ==========================================
    // Company
    // ==========================================

    Task<IEnumerable<InterviewResponseDto>>
        GetCompanyInterviewsAsync(
            Guid companyId,
            CancellationToken cancellationToken);

    // ==========================================
    // Candidate
    // ==========================================

    Task<IEnumerable<InterviewResponseDto>>
        GetCandidateInterviewsAsync(
            Guid candidateId,
            CancellationToken cancellationToken);

    // ==========================================
    // Update Interview
    // ==========================================

    Task<bool> UpdateAsync(
        Guid interviewId,
        UpdateInterviewDto dto,
        Guid companyId,
        CancellationToken cancellationToken);

    // ==========================================
    // Update Interview Status
    // ==========================================

    Task<bool> UpdateStatusAsync(
        Guid interviewId,
        string status,
        Guid companyId,
        CancellationToken cancellationToken);

    // ==========================================
    // Delete Interview
    // ==========================================

    Task<bool> DeleteAsync(
        Guid interviewId,
        Guid companyId,
        CancellationToken cancellationToken);
}