using Backend.DTOs.Interview;
using Backend.Interfaces.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterviewController : ControllerBase
{
    private readonly IInterviewService _service;

    public InterviewController(
        IInterviewService service)
    {
        _service = service;
    }

    // ==========================================
    // CREATE INTERVIEW
    // Company only
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null)
        {
            return BadRequest(new
            {
                message = "Interview data is required."
            });
        }

        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            return Unauthorized(new
            {
                message =
                    "Company ID not found in token."
            });
        }

        try
        {
            var result =
                await _service.CreateAsync(
                    dto,
                    companyId,
                    cancellationToken);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
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

    // ==========================================
    // GET INTERVIEW BY ID
    // ==========================================

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // Company
        // ==========================================

        if (User.IsInRole("Company"))
        {
            var companyIdClaim =
                User.FindFirstValue("CompanyId");

            if (!Guid.TryParse(
                    companyIdClaim,
                    out var companyId))
            {
                return Unauthorized();
            }

            var result =
                await _service.GetForCompanyAsync(
                    id,
                    companyId,
                    cancellationToken);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        // ==========================================
        // Candidate
        // ==========================================

        if (User.IsInRole("User"))
        {
            var userIdClaim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(
                    userIdClaim,
                    out var userId))
            {
                return Unauthorized();
            }

            var result =
                await _service.GetForCandidateAsync(
                    id,
                    userId,
                    cancellationToken);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        return Forbid();
    }

    // ==========================================
    // COMPANY INTERVIEWS
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpGet("company")]
    public async Task<IActionResult> CompanyInterviews(
        CancellationToken cancellationToken)
    {
        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            return Unauthorized();
        }

        var result =
            await _service.GetCompanyInterviewsAsync(
                companyId,
                cancellationToken);

        return Ok(result);
    }

    // ==========================================
    // CANDIDATE INTERVIEWS
    // ==========================================

    [Authorize(Roles = "User")]
    [HttpGet("user")]
    public async Task<IActionResult> CandidateInterviews(
        CancellationToken cancellationToken)
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
                userIdClaim,
                out var userId))
        {
            return Unauthorized();
        }

        var result =
            await _service.GetCandidateInterviewsAsync(
                userId,
                cancellationToken);

        return Ok(result);
    }

    // ==========================================
    // UPDATE INTERVIEW
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null)
        {
            return BadRequest(new
            {
                message =
                    "Interview data is required."
            });
        }

        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            return Unauthorized();
        }

        var success =
            await _service.UpdateAsync(
                id,
                dto,
                companyId,
                cancellationToken);

        if (!success)
        {
            return NotFound(new
            {
                message =
                    "Interview not found."
            });
        }

        return Ok(new
        {
            message =
                "Interview updated successfully."
        });
    }

    // ==========================================
    // UPDATE INTERVIEW STATUS
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateInterviewStatusDto dto,
        CancellationToken cancellationToken)
    {
        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.Status))
        {
            return BadRequest(new
            {
                message =
                    "Interview status is required."
            });
        }

        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            return Unauthorized();
        }

        var success =
            await _service.UpdateStatusAsync(
                id,
                dto.Status,
                companyId,
                cancellationToken);

        if (!success)
        {
            return NotFound(new
            {
                message =
                    "Interview not found or invalid status."
            });
        }

        return Ok(new
        {
            message =
                "Interview status updated successfully."
        });
    }

    // ==========================================
    // DELETE INTERVIEW
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var companyIdClaim =
            User.FindFirstValue("CompanyId");

        if (!Guid.TryParse(
                companyIdClaim,
                out var companyId))
        {
            return Unauthorized();
        }

        var success =
            await _service.DeleteAsync(
                id,
                companyId,
                cancellationToken);

        if (!success)
        {
            return NotFound(new
            {
                message =
                    "Interview not found."
            });
        }

        return Ok(new
        {
            message =
                "Interview deleted successfully."
        });
    }
}