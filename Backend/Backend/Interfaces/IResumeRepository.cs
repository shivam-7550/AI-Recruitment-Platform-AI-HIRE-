using Backend.Models;

namespace Backend.Interfaces;

public interface IResumeRepository
{
    Task<Resume?> GetResumeByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task AddResumeAsync(
        Resume resume,
        CancellationToken cancellationToken);

    Task UpdateResumeAsync(
        Resume resume,
        CancellationToken cancellationToken);

    Task DeleteResumeAsync(
        Resume resume,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}