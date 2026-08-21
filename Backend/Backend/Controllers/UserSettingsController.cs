using Backend.DTOs.UserSettings;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserSettingsController : ControllerBase
{
    private readonly IUserSettingsService _service;

    public UserSettingsController(
        IUserSettingsService service)
    {
        _service = service;
    }

    // =========================================================
    // GET: api/UserSettings
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetSettings(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var settings =
            await _service.GetSettingsAsync(
                userId.Value,
                cancellationToken);

        if (settings == null)
        {
            return NotFound(
                new
                {
                    message = "User settings not found."
                });
        }

        return Ok(settings);
    }

    // =========================================================
    // PUT: api/UserSettings
    // =========================================================

    [HttpPut]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdateUserSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        var settings =
            await _service.UpdateSettingsAsync(
                userId.Value,
                dto,
                cancellationToken);

        if (settings == null)
        {
            return NotFound(
                new
                {
                    message = "User not found."
                });
        }

        return Ok(settings);
    }

    // =========================================================
    // GET USER ID FROM JWT
    // =========================================================

    private Guid? GetUserId()
    {
        var claim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(claim))
        {
            return null;
        }

        return Guid.TryParse(
            claim,
            out var userId)
            ? userId
            : null;
    }
}