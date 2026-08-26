using Backend.DTOs.Dashboard;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers.Company;

[ApiController]
[Route("api/dashboards/company")]
[Authorize(Roles = "Company")]
public sealed class CompanyDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CompanyDashboardController(
        ApplicationDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // Company Dashboard
    // GET: api/dashboards/company
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<CompanyDashboardDto>> Get(
        CancellationToken cancellationToken)
    {
        // =====================================================
        // Get Logged-in Company User
        // =====================================================

        if (!Guid.TryParse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized();
        }


        // =====================================================
        // Get Company
        // =====================================================

        var company =
            await _db.Companies
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.UserId == userId,
                    cancellationToken);


        if (company is null)
        {
            return NotFound(
                "Company profile not found.");
        }


        // =====================================================
        // Get Company Jobs + Applications
        // =====================================================

        var jobs =
            await _db.Jobs
                .AsNoTracking()
                .Where(job =>
                    job.CompanyId == company.Id)
                .Include(job =>
                    job.Applications)
                .OrderByDescending(
                    job => job.CreatedAt)
                .ToListAsync(
                    cancellationToken);


        // =====================================================
        // Recent Applications
        // =====================================================

        var applications =
            jobs
                .SelectMany(
                    job =>
                        job.Applications.Select(
                            application =>
                                new RecentApplicationDto
                                {
                                    Id =
                                        application.Id,

                                    JobId =
                                        application.JobId,

                                    JobTitle =
                                        job.Title,

                                    CompanyName =
                                        company.CompanyName,

                                    Status =
                                        application.Status,

                                    ATSScore =
                                        application.ATSScore,

                                    AppliedAt =
                                        application.AppliedAt
                                }))
                .OrderByDescending(
                    item => item.AppliedAt)
                .ToList();


        // =====================================================
        // Dashboard Response
        // =====================================================

        var dashboard =
            new CompanyDashboardDto
            {
                Company =
                    new CompanyInfoDto
                    {
                        Id =
                            company.Id,

                        CompanyName =
                            company.CompanyName,

                        LogoUrl =
                            company.LogoUrl,

                        ApprovalStatus =
                            company.ApprovalStatus
                    },

                Stats =
                    new CompanyStatsDto
                    {
                        TotalJobs =
                            jobs.Count,

                        ActiveJobs =
                            jobs.Count(
                                job => job.IsActive),

                        TotalApplications =
                            applications.Count,

                        NewApplications =
                            applications.Count(
                                application =>
                                    application.Status
                                    == "Applied")
                    },

                Jobs =
                    jobs
                        .Select(
                            job =>
                                new CompanyJobDto
                                {
                                    Id =
                                        job.Id,

                                    Title =
                                        job.Title,

                                    Location =
                                        job.Location,

                                    IsActive =
                                        job.IsActive,

                                    LastDateToApply =
                                        job.LastDateToApply,

                                    ApplicationCount =
                                        job.Applications.Count
                                })
                        .ToList(),

                RecentApplications =
                    applications
                        .Take(20)
                        .ToList()
            };


        return Ok(dashboard);
    }
}