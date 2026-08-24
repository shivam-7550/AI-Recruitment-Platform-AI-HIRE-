using Backend.DTOs.UserProfile;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public class CandidateController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly IJobService _jobService;
    private readonly IResumeService _resumeService;
    private readonly IUserProfileService _userProfileService;

    public CandidateController(
        IApplicationService applicationService,
        IJobService jobService,
        IResumeService resumeService,
        IUserProfileService userProfileService)
    {
        _applicationService = applicationService;
        _jobService = jobService;
        _resumeService = resumeService;
        _userProfileService = userProfileService;
    }

    // ==========================================
    // Candidate Profile
    // ==========================================

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var profile = await _userProfileService
            .GetProfileAsync(userId, cancellationToken);

        if (profile == null)
            return NotFound(new { message = "Profile not found." });

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UserProfileDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var result = await _userProfileService
            .UpdateProfileAsync(
                userId,
                dto,
                cancellationToken);

        if (result == null)
            return BadRequest(
                new { message = "Profile update failed." });

        return Ok(result);
    }


    // ==========================================
    // Jobs
    // ==========================================

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(
        CancellationToken cancellationToken)
    {
        var jobs = await _jobService
            .GetAllJobsAsync(cancellationToken);

        return Ok(jobs);
    }

    [HttpGet("jobs/{id:guid}")]
    public async Task<IActionResult> GetJobById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var job = await _jobService
            .GetJobByIdAsync(
                id,
                cancellationToken);

        if (job == null)
            return NotFound(
                new { message = "Job not found." });

        return Ok(job);
    }


    // ==========================================
    // Applications
    // ==========================================

    [HttpGet("applications")]
    public async Task<IActionResult> GetMyApplications(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var applications = await _applicationService
            .GetApplicationsByUserAsync(
                userId,
                cancellationToken);

        return Ok(applications);
    }


    // ==========================================
    // Resume
    // ==========================================

    [HttpGet("resume")]
    public async Task<IActionResult> GetResume(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var resume = await _resumeService
            .GetResumeAsync(
                userId,
                cancellationToken);

        if (resume == null)
            return NotFound(
                new { message = "Resume not found." });

        return Ok(resume);
    }


    // ==========================================
    // Helper
    // ==========================================

    private Guid GetUserId()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userId, out var id))
            throw new UnauthorizedAccessException(
                "Invalid user ID.");

        return id;
    }
}