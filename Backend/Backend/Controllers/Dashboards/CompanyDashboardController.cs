using Backend.Data;
using Backend.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Dashboards;

[ApiController]
[Route("api/dashboards/company")]
[Authorize(Roles = "Company")]
public sealed class CompanyDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CompanyDashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<CompanyDashboardDto>> Get(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var company = await _db.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (company is null)
            return NotFound("Company profile not found.");

        var jobs = await _db.Jobs
            .AsNoTracking()
            .Where(x => x.CompanyId == company.Id)
            .Include(x => x.Applications)
                .ThenInclude(a => a.User)
                    .ThenInclude(u => u.Profile)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var applications = jobs
            .SelectMany(job => job.Applications.Select(app => new RecentApplicationDto
            {
                Id = app.Id,
                JobId = app.JobId,
                JobTitle = job.Title,
                CompanyName = company.CompanyName,
                Status = app.Status,
                ATSScore = app.ATSScore,
                AppliedAt = app.AppliedAt
            }))
            .OrderByDescending(x => x.AppliedAt)
            .ToList();

        var dashboard = new CompanyDashboardDto
        {
            Company = new CompanyInfoDto
            {
                Id = company.Id,
                CompanyName = company.CompanyName,
                LogoUrl = company.LogoUrl,
                ApprovalStatus = company.ApprovalStatus
            },

            Stats = new CompanyStatsDto
            {
                TotalJobs = jobs.Count,
                ActiveJobs = jobs.Count(x => x.IsActive),
                TotalApplications = applications.Count,
                NewApplications = applications.Count(x => x.Status == "Applied")
            },

            Jobs = jobs.Select(job => new CompanyJobDto
            {
                Id = job.Id,
                Title = job.Title,
                Location = job.Location,
                IsActive = job.IsActive,
                LastDateToApply = job.LastDateToApply,
                ApplicationCount = job.Applications.Count
            }).ToList(),

            RecentApplications = applications
                .Take(20)
                .ToList()
        };

        return Ok(dashboard);
    }
}