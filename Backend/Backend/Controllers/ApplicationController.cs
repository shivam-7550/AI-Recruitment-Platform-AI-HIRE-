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
    private readonly IResumeAIService _resumeAIService;

    public ApplicationController(
        IApplicationService applicationService,
        IApplicationRepository applicationRepository,
        IWebHostEnvironment environment,
        IResumeAIService resumeAIService)
    {
        _applicationService = applicationService;
        _applicationRepository = applicationRepository;
        _environment = environment;
        _resumeAIService = resumeAIService;
    }

    // =========================================================
    // CANDIDATE - APPLY
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

        var userId = GetCurrentUserId();

        if (!userId.HasValue)
        {
            return Unauthorized(new
            {
                message = "Invalid user token."
            });
        }

        try
        {
            var result =
                await _applicationService.ApplyJobAsync(
                    userId.Value,
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
        var userId = GetCurrentUserId();

        if (!userId.HasValue)
        {
            return Unauthorized(new
            {
                message = "Invalid user token."
            });
        }

        var applications =
            await _applicationService
                .GetApplicationsByUserAsync(
                    userId.Value,
                    cancellationToken);

        return Ok(applications);
    }

    // =========================================================
    // COMPANY - APPLICATIONS FOR ONE JOB
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

        var companyId =
            await GetCurrentCompanyIdAsync(
                cancellationToken);

        if (!companyId.HasValue)
        {
            return Unauthorized(new
            {
                message =
                    "Company ID not found for the logged-in company."
            });
        }

        try
        {
            var applications =
                await _applicationService
                    .GetApplicationsByJobAsync(
                        companyId.Value,
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
    // COMPANY - DOWNLOAD RESUME
    // GET: /api/Application/{applicationId}/resume
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpGet("{applicationId:guid}/resume")]
    public async Task<IActionResult> DownloadResume(
    Guid applicationId,
    CancellationToken cancellationToken)
    {
        if (applicationId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Invalid application ID."
            });
        }

        var companyId =
            await GetCurrentCompanyIdAsync(
                cancellationToken);

        if (!companyId.HasValue)
        {
            return Unauthorized(new
            {
                message =
                    "Company ID not found for the logged-in company."
            });
        }

        var application =
            await _applicationRepository
                .GetCompanyApplicationByIdAsync(
                    companyId.Value,
                    applicationId,
                    cancellationToken);

        if (application is null)
        {
            return NotFound(new
            {
                message = "Application not found."
            });
        }

        if (string.IsNullOrWhiteSpace(
                application.ResumeFilePath))
        {
            return NotFound(new
            {
                message =
                    "Resume file is not attached to this application."
            });
        }

        // =====================================================
        // RESUME PATH
        // =====================================================

        var webRootPath =
            _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");
        }

        // =====================================================
        // NORMALIZE STORED PATH
        // =====================================================

        var storedPath =
            application.ResumeFilePath
                .Replace(
                    '/',
                    Path.DirectorySeparatorChar)
                .Replace(
                    '\\',
                    Path.DirectorySeparatorChar)
                .TrimStart(
                    Path.DirectorySeparatorChar);

        // =====================================================
        // SECURITY - PREVENT PATH TRAVERSAL
        // =====================================================

        var fullPath =
            Path.GetFullPath(
                Path.Combine(
                    webRootPath,
                    storedPath));

        var fullWebRootPath =
            Path.GetFullPath(
                webRootPath)
                .TrimEnd(
                    Path.DirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(
                fullWebRootPath,
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Invalid resume file path."
            });
        }

        // =====================================================
        // FILE EXISTS
        // =====================================================

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new
            {
                message =
                    "Resume file is no longer available."
            });
        }

        // =====================================================
        // CONTENT TYPE
        // =====================================================

        var extension =
            Path.GetExtension(fullPath)
                .ToLowerInvariant();

        var contentType =
            extension switch
            {
                ".pdf" =>
                    "application/pdf",

                ".doc" =>
                    "application/msword",

                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

                ".word" =>
                    "application/msword",

                _ =>
                    "application/octet-stream"
            };

        // =====================================================
        // DOWNLOAD FILE
        // =====================================================

        var downloadFileName =
            !string.IsNullOrWhiteSpace(
                application.ResumeFileName)
                    ? application.ResumeFileName
                    : Path.GetFileName(fullPath);

        return PhysicalFile(
            fullPath,
            contentType,
            downloadFileName);
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
                message =
                    "Invalid application ID."
            });
        }

        if (dto is null)
        {
            return BadRequest(new
            {
                message =
                    "Application status is required."
            });
        }

        var companyId =
            await GetCurrentCompanyIdAsync(
                cancellationToken);

        if (!companyId.HasValue)
        {
            return Unauthorized(new
            {
                message =
                    "Company ID not found for the logged-in company."
            });
        }

        var result =
            await _applicationService
                .UpdateApplicationStatusAsync(
                    companyId.Value,
                    applicationId,
                    dto,
                    cancellationToken);

        if (result is null)
        {
            return NotFound(new
            {
                message =
                    "Application not found."
            });
        }

        return Ok(result);
    }

    // =========================================================
    // COMPANY - AI ANALYSIS
    // POST: /api/Application/{applicationId}/ai-analysis
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpPost("{applicationId:guid}/ai-analysis")]
    public async Task<IActionResult> AnalyzeCandidateWithAI(
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        if (applicationId == Guid.Empty)
        {
            return BadRequest(new
            {
                message =
                    "Invalid application ID."
            });
        }

        var companyId =
            await GetCurrentCompanyIdAsync(
                cancellationToken);

        if (!companyId.HasValue)
        {
            return Unauthorized(new
            {
                message =
                    "Company ID not found for the logged-in company."
            });
        }

        try
        {
            var application =
                await _applicationRepository
                    .GetCompanyApplicationByIdAsync(
                        companyId.Value,
                        applicationId,
                        cancellationToken);

            if (application is null)
            {
                return NotFound(new
                {
                    message =
                        "Application not found."
                });
            }

            //if (
            //    application.Resume is null ||
            //    string.IsNullOrWhiteSpace(
            //        application.ResumeText)
            //)
            //{
            //    return BadRequest(new
            //    {
            //        message =
            //            "Candidate resume text is not available for AI analysis."
            //    });
            //}
            if (string.IsNullOrWhiteSpace(
                application.ResumeText))
            {
                return BadRequest(new
                {
                    message =
                        "Candidate resume text is not available for AI analysis."
                });
            }

            var job =
                application.Job;

            if (job is null)
            {
                return BadRequest(new
                {
                    message =
                        "Job information is not available."
                });
            }

            var result =
                await _resumeAIService
                    .AnalyzeCandidateForCompanyAsync(
                        application.ResumeText,
                        application.ResumeExtractedSkills
                            ?? application.Skills,
                        job.Title,
                        job.Description,
                        job.Skills,
                        cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(
                502,
                new
                {
                    message =
                        "AI candidate analysis is temporarily unavailable.",
                    detail =
                        ex.Message
                });
        }
    }

    // =========================================================
    // HELPER - CURRENT USER ID
    // =========================================================

    private Guid? GetCurrentUserId()
    {
        var claim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (
            Guid.TryParse(
                claim,
                out var userId)
        )
        {
            return userId;
        }

        return null;
    }

    // =========================================================
    // HELPER - CURRENT COMPANY ID
    // =========================================================

    private async Task<Guid?>
        GetCurrentCompanyIdAsync(
            CancellationToken cancellationToken)
    {
        // -----------------------------------------------------
        // 1. CompanyId claim
        // -----------------------------------------------------

        var companyIdClaim =
            User.FindFirstValue(
                "CompanyId");

        if (
            Guid.TryParse(
                companyIdClaim,
                out var companyId)
        )
        {
            return companyId;
        }

        // -----------------------------------------------------
        // 2. Alternative custom claim
        // -----------------------------------------------------

        var alternativeCompanyId =
            User.FindFirstValue(
                "companyId");

        if (
            Guid.TryParse(
                alternativeCompanyId,
                out companyId)
        )
        {
            return companyId;
        }

        // -----------------------------------------------------
        // 3. If NameIdentifier is actually CompanyId
        // -----------------------------------------------------

        var nameIdentifier =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (
            Guid.TryParse(
                nameIdentifier,
                out companyId)
        )
        {
            return companyId;
        }

        return null;
    }
}