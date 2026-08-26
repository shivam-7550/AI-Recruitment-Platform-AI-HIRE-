using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class ApplicationRepository : IApplicationRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ApplicationRepository(
        ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // ==========================================
    // Add Application
    // ==========================================

    public async Task AddApplicationAsync(
        JobApplication application,
        CancellationToken cancellationToken)
    {
        await _dbContext.JobApplications.AddAsync(
            application,
            cancellationToken);
    }

    // ==========================================
    // Candidate - Check Existing Application
    // ==========================================

    public async Task<JobApplication?> GetApplicationByUserAndJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.JobApplications
            .FirstOrDefaultAsync(
                x =>
                    x.UserId == userId &&
                    x.JobId == jobId,
                cancellationToken);
    }

    // ==========================================
    // Candidate - My Applications
    // ==========================================

    public async Task<IEnumerable<JobApplication>>
        GetApplicationsByUserAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        return await _dbContext.JobApplications
     .AsNoTracking()
     .Include(x => x.Job)
         .ThenInclude(x => x.Company)

     .Include(x => x.Resume)

     .Where(x => x.UserId == userId)

     .OrderByDescending(x => x.AppliedAt)

     .ToListAsync(cancellationToken);
    }

    // ==========================================
    // Company - Job Applications
    // ==========================================

    public async Task<IEnumerable<JobApplication>>
        GetApplicationsByJobAsync(
            Guid companyId,
            Guid jobId,
            CancellationToken cancellationToken)
    {
        return await _dbContext.JobApplications
    .AsNoTracking()
    .Include(x => x.Job)
        .ThenInclude(x => x.Company)

    .Include(x => x.Resume)

    .Where(
        x =>
            x.JobId == jobId &&
            x.Job.CompanyId == companyId)

    .OrderByDescending(x => x.ATSScore)

    .ThenByDescending(x => x.AppliedAt)

    .ToListAsync(cancellationToken);
    }

    // ==========================================
    // Company - Application By ID
    // ==========================================

    public async Task<JobApplication?> GetCompanyApplicationByIdAsync(
        Guid companyId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.JobApplications
            .Include(x => x.Job)
                .ThenInclude(x => x.Company)
            .Include(x => x.Resume)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == applicationId &&
                    x.Job.CompanyId == companyId,
                cancellationToken);
    }

    // ==========================================
    // Save Changes
    // ==========================================

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _dbContext.SaveChangesAsync(
            cancellationToken);
    }
}
