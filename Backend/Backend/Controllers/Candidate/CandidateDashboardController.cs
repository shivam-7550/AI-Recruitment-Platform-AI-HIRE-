using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User")]
public class CandidateDashboardController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly IJobService _jobService;
    private readonly IResumeService _resumeService;
    private readonly IUserProfileService _userProfileService;

    public CandidateDashboardController(
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

    [HttpGet]
    public async Task<IActionResult> GetDashboard(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var profileTask = _userProfileService
            .GetProfileAsync(userId, cancellationToken);

        var applicationsTask = _applicationService
            .GetApplicationsByUserAsync(userId, cancellationToken);

        var resumeTask = _resumeService
            .GetResumeAsync(userId, cancellationToken);

        var jobsTask = _jobService
            .GetAllJobsAsync(cancellationToken);

        await Task.WhenAll(
            profileTask,
            applicationsTask,
            resumeTask,
            jobsTask);

        var profile = await profileTask;
        var applications = await applicationsTask;
        var resume = await resumeTask;
        var jobs = await jobsTask;

        return Ok(new
        {
            profile,
            applications,
            resume,
            recommendedJobs = jobs.Take(10)
        });
    }


    // ==========================================
    // Dashboard Statistics
    // ==========================================

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        var applications = await _applicationService
            .GetApplicationsByUserAsync(userId, cancellationToken);

        var totalApplications = applications.Count();

        var shortlisted = applications.Count(x =>
            string.Equals(
                x.Status,
                "Shortlisted",
                StringComparison.OrdinalIgnoreCase));

        var interviews = applications.Count(x =>
            string.Equals(
                x.Status,
                "Interview",
                StringComparison.OrdinalIgnoreCase));

        var hired = applications.Count(x =>
            string.Equals(
                x.Status,
                "Hired",
                StringComparison.OrdinalIgnoreCase));

        var rejected = applications.Count(x =>
            string.Equals(
                x.Status,
                "Rejected",
                StringComparison.OrdinalIgnoreCase));

        return Ok(new
        {
            totalApplications,
            shortlisted,
            interviews,
            hired,
            rejected
        });
    }


    // ==========================================
    // Helper
    // ==========================================

    private Guid GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userId, out var id))
            throw new UnauthorizedAccessException("Invalid user ID.");

        return id;
    }
}