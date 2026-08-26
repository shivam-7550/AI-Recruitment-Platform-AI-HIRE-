using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class UserSettingsRepository : IUserSettingsRepository
{
    private readonly ApplicationDbContext _context;

    public UserSettingsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserSettings?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.UserSettings
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);
    }

    public async Task<UserSettings> CreateAsync(
        UserSettings settings,
        CancellationToken cancellationToken)
    {
        await _context.UserSettings.AddAsync(
            settings,
            cancellationToken);

        return settings;
    }

    public Task UpdateAsync(
        UserSettings settings,
        CancellationToken cancellationToken)
    {
        _context.UserSettings.Update(settings);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}