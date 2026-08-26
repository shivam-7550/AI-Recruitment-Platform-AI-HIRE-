using Backend.DTOs.UserSettings;

namespace Backend.Interfaces.Services;

public interface IUserSettingsService
{
    Task<UserSettingsDto?> GetSettingsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<UserSettingsDto?> UpdateSettingsAsync(
        Guid userId,
        UpdateUserSettingsDto dto,
        CancellationToken cancellationToken);
}
