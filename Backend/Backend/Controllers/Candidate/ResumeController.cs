using Backend.DTOs.Resume;
using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public sealed class ResumeController : ControllerBase
{
    private readonly IResumeService _resumeService;

    public ResumeController(
        IResumeService resumeService)
    {
        _resumeService = resumeService;
    }


    // =====================================================
    // Upload Resume
    // =====================================================

    [HttpPost("upload")]
    public async Task<IActionResult> UploadResume(
        [FromForm] UploadResumeDto dto,
        CancellationToken cancellationToken)
    {
        var userId =
            GetUserId();

        if (userId == null)
            return Unauthorized();

        try
        {
            var result =
                await _resumeService
                    .UploadResumeAsync(
                        userId.Value,
                        dto,
                        cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message = ex.Message
                });
        }
    }


    // =====================================================
    // Get Resume
    // =====================================================

    [HttpGet]
    public async Task<IActionResult> GetResume(
        CancellationToken cancellationToken)
    {
        var userId =
            GetUserId();

        if (userId == null)
            return Unauthorized();

        var result =
            await _resumeService
                .GetResumeAsync(
                    userId.Value,
                    cancellationToken);

        if (result == null)
        {
            return NotFound(
                "Resume not found.");
        }

        return Ok(result);
    }


    // =====================================================
    // Analyze Resume
    // =====================================================

    [HttpGet("{resumeId:guid}/analysis")]
    public async Task<IActionResult> AnalyzeResume(
        Guid resumeId,
        CancellationToken cancellationToken)
    {
        var userId =
            GetUserId();

        if (userId == null)
            return Unauthorized();

        try
        {
            var result =
                await _resumeService
                    .AnalyzeResumeAsync(
                        userId.Value,
                        resumeId,
                        cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
    }


    // =====================================================
    // Delete Resume
    // =====================================================

    [HttpDelete]
    public async Task<IActionResult> DeleteResume(
        CancellationToken cancellationToken)
    {
        var userId =
            GetUserId();

        if (userId == null)
            return Unauthorized();

        var deleted =
            await _resumeService
                .DeleteResumeAsync(
                    userId.Value,
                    cancellationToken);

        if (!deleted)
        {
            return NotFound(
                "Resume not found.");
        }

        return Ok(
            new
            {
                message =
                    "Resume deleted successfully."
            });
    }


    // =====================================================
    // Current User ID
    // =====================================================

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
