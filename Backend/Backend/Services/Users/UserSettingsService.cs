using Backend.DTOs.UserSettings;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Users;

public sealed class UserSettingsService : IUserSettingsService
{
    private readonly IUserSettingsRepository _repository;

    public UserSettingsService(
        IUserSettingsRepository repository)
    {
        _repository = repository;
    }

    // =========================================================
    // GET SETTINGS
    // =========================================================

    public async Task<UserSettingsDto?> GetSettingsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var settings =
            await _repository.GetByUserIdAsync(
                userId,
                cancellationToken);

        if (settings == null)
        {
            return null;
        }

        return Map(settings);
    }

    // =========================================================
    // UPDATE SETTINGS
    // =========================================================

    public async Task<UserSettingsDto?> UpdateSettingsAsync(
        Guid userId,
        UpdateUserSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var settings =
            await _repository.GetByUserIdAsync(
                userId,
                cancellationToken);

        if (settings == null)
        {
            settings = CreateDefaultSettings(userId);

            Apply(settings, dto);

            await _repository.CreateAsync(
                settings,
                cancellationToken);
        }
        else
        {
            Apply(settings, dto);

            settings.UpdatedAt =
                DateTime.UtcNow;

            await _repository.UpdateAsync(
                settings,
                cancellationToken);
        }

        await _repository.SaveChangesAsync(
            cancellationToken);

        return Map(settings);
    }

    // =========================================================
    // CREATE DEFAULT SETTINGS
    // =========================================================

    private static UserSettings CreateDefaultSettings(
        Guid userId)
    {
        return new UserSettings
        {
            UserId = userId,

            EmailNotifications = true,
            ApplicationUpdates = true,
            JobAlerts = true,
            RecruiterMessages = true,
            MarketingEmails = false,
            WeeklyJobDigest = true,
            ApplicationStatusNotifications = true,

            ProfileVisibility = true,
            ShowContactInformation = false,
            AllowRecruiterSearch = true,

            UpdatedAt = DateTime.UtcNow
        };
    }

    // =========================================================
    // APPLY DTO
    // =========================================================

    private static void Apply(
        UserSettings target,
        UpdateUserSettingsDto source)
    {
        target.EmailNotifications =
            source.EmailNotifications;

        target.ApplicationUpdates =
            source.ApplicationUpdates;

        target.JobAlerts =
            source.JobAlerts;

        target.RecruiterMessages =
            source.RecruiterMessages;

        target.MarketingEmails =
            source.MarketingEmails;

        target.WeeklyJobDigest =
            source.WeeklyJobDigest;

        target.ApplicationStatusNotifications =
            source.ApplicationStatusNotifications;

        target.ProfileVisibility =
            source.ProfileVisibility;

        target.ShowContactInformation =
            source.ShowContactInformation;

        target.AllowRecruiterSearch =
            source.AllowRecruiterSearch;

        target.UpdatedAt =
            DateTime.UtcNow;
    }

    // =========================================================
    // MAP ENTITY → DTO
    // =========================================================

    private static UserSettingsDto Map(
        UserSettings settings)
    {
        return new UserSettingsDto
        {
            EmailNotifications =
                settings.EmailNotifications,

            ApplicationUpdates =
                settings.ApplicationUpdates,

            JobAlerts =
                settings.JobAlerts,

            RecruiterMessages =
                settings.RecruiterMessages,

            MarketingEmails =
                settings.MarketingEmails,

            WeeklyJobDigest =
                settings.WeeklyJobDigest,

            ApplicationStatusNotifications =
                settings.ApplicationStatusNotifications,

            ProfileVisibility =
                settings.ProfileVisibility,

            ShowContactInformation =
                settings.ShowContactInformation,

            AllowRecruiterSearch =
                settings.AllowRecruiterSearch
        };
    }
}
