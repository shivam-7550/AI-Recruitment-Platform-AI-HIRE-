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

    [Authorize(Roles = "Company")]
    [HttpPost]
    public async Task<IActionResult> Create(
        CreateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        var result =
            await _service.CreateAsync(
                dto,
                cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result =
            await _service.GetByIdAsync(
                id,
                cancellationToken);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

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

    [Authorize(Roles = "Candidate")]
    [HttpGet("candidate")]
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

    [Authorize(Roles = "Company")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateInterviewDto dto,
        CancellationToken cancellationToken)
    {
        var success =
            await _service.UpdateAsync(
                id,
                dto,
                cancellationToken);

        if (!success)
        {
            return NotFound();
        }

        return Ok(new
        {
            Message = "Interview updated successfully."
        });
    }
}