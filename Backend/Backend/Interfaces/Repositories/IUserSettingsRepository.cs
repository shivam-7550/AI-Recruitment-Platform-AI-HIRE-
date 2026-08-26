using Backend.Models;

namespace Backend.Interfaces.Repositories;

public interface IUserSettingsRepository
{
    Task<UserSettings?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<UserSettings> CreateAsync(
        UserSettings settings,
        CancellationToken cancellationToken);

    Task UpdateAsync(
        UserSettings settings,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
