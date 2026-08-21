using Backend.Constants;
using Backend.Data;
using Backend.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Dashboards;

[ApiController]
[Route("api/dashboards/admin")]
[Authorize(Roles = Roles.Admin)]
public sealed class AdminDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AdminDashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get(
        CancellationToken cancellationToken)
    {
        var users = await _db.Users
            .AsNoTracking()
            .GroupBy(x => x.Role)
            .Select(x => new UserRoleCountDto
            {
                Role = x.Key,
                Count = x.Count()
            })
            .ToListAsync(cancellationToken);

        var pendingCompanies = await _db.Companies
            .AsNoTracking()
            .Where(x => x.ApprovalStatus == "Pending")
            .OrderBy(x => x.CreatedAt)
            .Take(20)
            .Select(x => new PendingCompanyDto
            {
                Id = x.Id,
                CompanyName = x.CompanyName,
                Email = x.Email,
                Industry = x.Industry,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var response = new AdminDashboardDto
        {
            Stats = new AdminStatsDto
            {
                TotalUsers = users.Sum(x => x.Count),

                Candidates = users
                    .Where(x => x.Role == Roles.User)
                    .Sum(x => x.Count),

                Companies = await _db.Companies
                    .CountAsync(cancellationToken),

                ActiveJobs = await _db.Jobs
                    .CountAsync(x => x.IsActive, cancellationToken),

                Applications = await _db.JobApplications
                    .CountAsync(cancellationToken),

                PendingApprovals = pendingCompanies.Count
            },

            UsersByRole = users,

            PendingCompanies = pendingCompanies
        };

        return Ok(response);
    }
}