using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User,Company,Admin")]
public sealed class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(
        INotificationService notificationService)
    {
        _notificationService = notificationService;
    }


    // =========================================================
    // Get My Notifications
    // GET: api/Notification
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetMine(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var notifications =
            await _notificationService.GetForUserAsync(
                userId.Value,
                cancellationToken);

        return Ok(notifications);
    }


    // =========================================================
    // Mark Notification As Read
    // PUT: api/Notification/{id}/read
    // =========================================================

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var updated =
            await _notificationService.MarkAsReadAsync(
                id,
                userId.Value,
                cancellationToken);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }

        return NoContent();
    }


    // =========================================================
    // Mark All Notifications As Read
    // PUT: api/Notification/read-all
    // =========================================================

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(
            userId.Value,
            cancellationToken);

        return NoContent();
    }


    // =========================================================
    // Clear All Notifications
    // PUT: api/Notification/clear-all
    // =========================================================

    [HttpPut("clear-all")]
    public async Task<IActionResult> ClearAll(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        await _notificationService.ClearAllAsync(
            userId.Value,
            cancellationToken);

        return NoContent();
    }


    // =========================================================
    // Get User ID From JWT
    // =========================================================

    private Guid? GetUserId()
    {
        var claim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        return Guid.TryParse(
            claim,
            out var userId)
            ? userId
            : null;
    }
}
