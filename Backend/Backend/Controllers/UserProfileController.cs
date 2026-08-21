using Backend.DTOs.UserProfile;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public sealed class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;

    public UserProfileController(
        IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    // =========================================================
    // GET PROFILE
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> Get(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var profile = await _userProfileService.GetProfileAsync(
            userId.Value,
            cancellationToken);

        if (profile == null)
            return NotFound("User profile not found.");

        return Ok(profile);
    }

    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    [HttpPut]
    public async Task<ActionResult<UserProfileDto>> Update(
        [FromBody] UserProfileDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        if (dto == null)
            return BadRequest("Profile data is required.");

        var result = await _userProfileService.UpdateProfileAsync(
            userId.Value,
            dto,
            cancellationToken);

        if (result == null)
            return NotFound("User profile not found.");

        return Ok(result);
    }

    // =========================================================
    // UPLOAD PROFILE PHOTO
    // =========================================================

    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhoto(
        IFormFile photo,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        if (photo == null || photo.Length == 0)
            return BadRequest("Photo is required.");

        var result = await _userProfileService.UploadPhotoAsync(
            userId.Value,
            photo,
            cancellationToken);

        if (result == null)
            return NotFound("User profile not found.");

        return Ok(new
        {
            photoUrl = result
        });
    }

    // =========================================================
    // GET USER ID FROM JWT
    // =========================================================

    private Guid? GetUserId()
    {
        var claim = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        return Guid.TryParse(claim, out var userId)
            ? userId
            : null;
    }
}
