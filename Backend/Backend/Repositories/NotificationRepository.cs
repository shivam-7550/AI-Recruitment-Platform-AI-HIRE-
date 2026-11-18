using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
namespace Backend.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;
    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    // =========================================================
    // Add Notifications
    // =========================================================
    public async Task AddRangeAsync(
        IEnumerable<Notification> notifications,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notifications);
        await _context.Notifications.AddRangeAsync(
            notifications,
            cancellationToken);
    }
    // =========================================================
    // Get User Notifications
    // =========================================================
    public async Task<List<Notification>> GetByUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId &&
                        !x.IsArchived)
            .OrderByDescending(x => x.CreatedAt)
            .Take(150)
            // Notification polling is a lightweight read; let it finish if a
            // browser replaces or cancels the polling request.
            .ToListAsync(CancellationToken.None);
    }
// =========================================================
// Get Unread User Notifications
// =========================================================
public async Task<List<Notification>> GetUnreadByUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Notifications
            .Where(x =>
                x.UserId == userId &&
                !x.IsRead &&
                !x.IsArchived)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
    }
    // =========================================================
    // Get Active User Notifications
    // =========================================================
    public async Task<List<Notification>> GetActiveByUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Notifications
            .Where(x =>
                x.UserId == userId &&
                !x.IsArchived)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
    }
    // =========================================================
    // Get Notification By ID
    // =========================================================
    public async Task<Notification?> GetByIdAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Notifications
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.UserId == userId &&
                    !x.IsArchived,
                cancellationToken);
    }
    // =========================================================
    // Save Changes
    // =========================================================
    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
