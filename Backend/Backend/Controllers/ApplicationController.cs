using Backend.DTOs.Application;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly IApplicationRepository _applicationRepository;
    private readonly IWebHostEnvironment _environment;

    public ApplicationController(
        IApplicationService applicationService,
        IApplicationRepository applicationRepository,
        IWebHostEnvironment environment)
    {
        _applicationService = applicationService;
        _applicationRepository = applicationRepository;
        _environment = environment;
    }

    // =========================================================
    // CANDIDATE - APPLY FOR JOB
    // POST: /api/Application/apply
    // =========================================================

    [Authorize(Roles = "User")]
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyJob(
        [FromBody] ApplyJobDto dto,
        CancellationToken cancellationToken)
    {
        if (dto is null)
        {
            return BadRequest(new
            {
                message = "Application data is required."
            });
        }

        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
                userIdClaim,
                out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user token."
            });
        }

        try
        {
            var result =
                await _applicationService
                    .ApplyJobAsync(
                        userId,
                        dto,
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // CANDIDATE - MY APPLICATIONS
    // GET: /api/Application/my-applications
    // =========================================================

    [Authorize(Roles = "User")]
    [HttpGet("my-applications")]
    public async Task<IActionResult> MyApplications(
        CancellationToken cancellationToken)
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
                userIdClaim,
                out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user token."
            });
        }

        var applications =
            await _applicationService
                .GetApplicationsByUserAsync(
                    userId,
                    cancellationToken);

        return Ok(applications);
    }

    // =========================================================
    // COMPANY - VIEW APPLICATIONS FOR A JOB
    // GET: /api/Application/job/{jobId}
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpGet("job/{jobId:guid}")]
    public async Task<IActionResult> GetJobApplications(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        if (jobId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Invalid job ID."
            });
        }

        // -----------------------------------------------------
        // First try CompanyId claim
        // -----------------------------------------------------

        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            // -------------------------------------------------
            // Fallback: NameIdentifier
            //
            // This is useful only when NameIdentifier
            // represents CompanyId in your JWT.
            // -------------------------------------------------

            var nameIdentifier =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(
                    nameIdentifier,
                    out companyId))
            {
                return Unauthorized(new
                {
                    message =
                        "Company ID not found in token."
                });
            }
        }

        try
        {
            var applications =
                await _applicationService
                    .GetApplicationsByJobAsync(
                        companyId,
                        jobId,
                        cancellationToken);

            return Ok(applications);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // COMPANY - DOWNLOAD A CANDIDATE RESUME
    // GET: /api/Application/{applicationId}/resume
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpGet("{applicationId:guid}/resume")]
    public async Task<IActionResult> DownloadResume(
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        var companyIdClaim = User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(companyIdClaim, out var companyId))
        {
            return Unauthorized(new { message = "Company ID not found in token." });
        }

        var application = await _applicationRepository
            .GetCompanyApplicationByIdAsync(
                companyId,
                applicationId,
                cancellationToken);

        if (application?.Resume is null ||
            string.IsNullOrWhiteSpace(application.Resume.FilePath))
        {
            return NotFound(new { message = "Resume not found for this application." });
        }

        var relativePath = application.Resume.FilePath.TrimStart('/', '\\');
        var fullPath = Path.Combine(_environment.WebRootPath, relativePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "Resume file is no longer available." });
        }

        var contentType = Path.GetExtension(fullPath).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };

        return PhysicalFile(
            fullPath,
            contentType,
            application.Resume.FileName);
    }


    // =========================================================
    // COMPANY - UPDATE APPLICATION STATUS
    // PUT: /api/Application/{applicationId}/status
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpPut("{applicationId:guid}/status")]
    public async Task<IActionResult> UpdateApplicationStatus(
        Guid applicationId,
        [FromBody] UpdateApplicationStatusDto dto,
        CancellationToken cancellationToken)
    {
        if (applicationId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Invalid application ID."
            });
        }

        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            var nameIdentifier =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(
                    nameIdentifier,
                    out companyId))
            {
                return Unauthorized(new
                {
                    message =
                        "Company ID not found in token."
                });
            }
        }

        var result =
            await _applicationService
                .UpdateApplicationStatusAsync(
                    companyId,
                    applicationId,
                    dto,
                    cancellationToken);

        if (result is null)
        {
            return NotFound(new
            {
                message = "Application not found."
            });
        }

        return Ok(result);
    }
}
