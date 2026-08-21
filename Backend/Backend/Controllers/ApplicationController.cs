using Backend.DTOs.Application;
using Backend.Interfaces;
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

    public ApplicationController(
        IApplicationService applicationService)
    {
        _applicationService = applicationService;
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
