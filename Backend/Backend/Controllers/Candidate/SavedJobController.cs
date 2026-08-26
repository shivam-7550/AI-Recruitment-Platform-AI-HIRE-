using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public sealed class SavedJobController : ControllerBase
{
    private readonly ISavedJobService _savedJobService;

    public SavedJobController(
        ISavedJobService savedJobService)
    {
        _savedJobService = savedJobService;
    }

    // =========================================================
    // GET SAVED JOBS
    // GET: /api/SavedJob
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> Mine(
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();

        if (userId == null)
            return Unauthorized();

        var result =
            await _savedJobService.GetSavedJobsAsync(
                userId.Value,
                cancellationToken);

        return Ok(result);
    }

    // =========================================================
    // SAVE JOB
    // POST: /api/SavedJob/{jobId}
    // =========================================================

    [HttpPost("{jobId:guid}")]
    public async Task<IActionResult> Save(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();

        if (userId == null)
            return Unauthorized();

        var jobExists =
            await _savedJobService.SaveJobAsync(
                userId.Value,
                jobId,
                cancellationToken);

        if (!jobExists)
        {
            return NotFound(new
            {
                message = "Active job not found."
            });
        }

        return Ok(new
        {
            message = "Job saved."
        });
    }

    // =========================================================
    // REMOVE SAVED JOB
    // DELETE: /api/SavedJob/{jobId}
    // =========================================================

    [HttpDelete("{jobId:guid}")]
    public async Task<IActionResult> Remove(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();

        if (userId == null)
            return Unauthorized();

        var removed =
            await _savedJobService.RemoveSavedJobAsync(
                userId.Value,
                jobId,
                cancellationToken);

        if (!removed)
            return NoContent();

        return NoContent();
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private Guid? CurrentUserId()
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
