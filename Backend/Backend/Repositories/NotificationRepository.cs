using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(
        ApplicationDbContext context)
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
            .Where(item =>
                item.UserId == userId &&
                !item.IsArchived)
            .OrderByDescending(item => item.CreatedAt)
            .Take(50)
            // This is a small, read-only polling query. Do not cancel the
            // database command when the browser replaces a poll request.
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
            .Where(item =>
                item.UserId == userId &&
                !item.IsRead &&
                !item.IsArchived)
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
            .Where(item =>
                item.UserId == userId &&
                !item.IsArchived)
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
                item =>
                    item.Id == id &&
                    item.UserId == userId &&
                    !item.IsArchived,
                cancellationToken);
    }


    // =========================================================
    // Save Changes
    // =========================================================

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}
