using Backend.DTOs.SavedJob;

namespace Backend.Interfaces;

public interface ISavedJobService
{
    Task<IEnumerable<SavedJobResponseDto>> GetSavedJobsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<bool> SaveJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken);

    Task<bool> RemoveSavedJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken);
}