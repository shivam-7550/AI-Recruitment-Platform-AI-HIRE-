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

    public AdminDashboardController(
        ApplicationDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // Get Admin Dashboard
    // GET: api/dashboards/admin
    // =========================================================

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get(
        CancellationToken cancellationToken)
    {
        // =====================================================
        // Users By Role
        // =====================================================

        var usersByRole =
            await _db.Users
                .AsNoTracking()
                .GroupBy(user => user.Role)
                .Select(group => new UserRoleCountDto
                {
                    Role = group.Key,
                    Count = group.Count()
                })
                .ToListAsync(cancellationToken);

        // =====================================================
        // Pending Companies
        // =====================================================

        var pendingCompanies =
            await _db.Companies
                .AsNoTracking()
                .Where(company =>
                    company.ApprovalStatus == "Pending")
                .OrderBy(company => company.CreatedAt)
                .Take(20)
                .Select(company => new PendingCompanyDto
                {
                    Id = company.Id,
                    CompanyName = company.CompanyName,
                    Email = company.Email,
                    Industry = company.Industry,
                    CreatedAt = company.CreatedAt
                })
                .ToListAsync(cancellationToken);

        // =====================================================
        // Pending Approval Count
        // =====================================================

        var pendingApprovalCount =
            await _db.Companies
                .AsNoTracking()
                .CountAsync(
                    company =>
                        company.ApprovalStatus == "Pending",
                    cancellationToken);

        // =====================================================
        // Total Companies
        // =====================================================

        var totalCompanies =
            await _db.Companies
                .AsNoTracking()
                .CountAsync(cancellationToken);

        // =====================================================
        // Active Jobs
        // =====================================================

        var activeJobs =
            await _db.Jobs
                .AsNoTracking()
                .CountAsync(
                    job => job.IsActive,
                    cancellationToken);

        // =====================================================
        // Total Applications
        // =====================================================

        var totalApplications =
            await _db.JobApplications
                .AsNoTracking()
                .CountAsync(cancellationToken);

        // =====================================================
        // Dashboard Response
        // =====================================================

        var response =
            new AdminDashboardDto
            {
                Stats =
                    new AdminStatsDto
                    {
                        TotalUsers =
                            usersByRole.Sum(
                                item => item.Count),

                        Candidates =
                            usersByRole
                                .Where(item =>
                                    item.Role == Roles.User)
                                .Sum(item => item.Count),

                        Companies =
                            totalCompanies,

                        ActiveJobs =
                            activeJobs,

                        Applications =
                            totalApplications,

                        PendingApprovals =
                            pendingApprovalCount
                    },

                UsersByRole =
                    usersByRole,

                PendingCompanies =
                    pendingCompanies
            };

        return Ok(response);
    }
}