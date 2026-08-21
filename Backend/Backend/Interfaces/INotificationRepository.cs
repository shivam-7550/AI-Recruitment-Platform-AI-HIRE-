using Backend.Models;

namespace Backend.Interfaces;

public interface INotificationRepository
{
    Task AddRangeAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken);

    Task<List<Notification>> GetByUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<List<Notification>> GetUnreadByUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<List<Notification>> GetActiveByUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Notification?> GetByIdAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
