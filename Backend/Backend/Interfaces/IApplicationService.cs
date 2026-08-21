using Backend.DTOs.Application;

namespace Backend.Interfaces;

public interface IApplicationService
{
    // =========================================================
    // CANDIDATE
    // =========================================================

    Task<ApplicationResponseDto> ApplyJobAsync(
        Guid userId,
        ApplyJobDto dto,
        CancellationToken cancellationToken);

    Task<IEnumerable<ApplicationResponseDto>>
        GetApplicationsByUserAsync(
            Guid userId,
            CancellationToken cancellationToken);

    // =========================================================
    // COMPANY
    // =========================================================

    Task<IEnumerable<ApplicationResponseDto>>
        GetApplicationsByJobAsync(
            Guid companyId,
            Guid jobId,
            CancellationToken cancellationToken);

    Task<ApplicationResponseDto?> UpdateApplicationStatusAsync(
        Guid companyId,
        Guid applicationId,
        UpdateApplicationStatusDto dto,
        CancellationToken cancellationToken);
}
