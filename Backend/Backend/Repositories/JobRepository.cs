using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class JobRepository : IJobRepository
{
    private readonly ApplicationDbContext _context;

    public JobRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // Get All Jobs
    // =========================================================

    public async Task<IEnumerable<Job>> GetAllJobsAsync(
        CancellationToken cancellationToken)
    {
        return await _context.Jobs
            .AsNoTracking()
            .Include(job => job.Company)
            .OrderByDescending(job => job.CreatedAt)
            .ToListAsync(cancellationToken);
    }


    // =========================================================
    // Get Job By Id
    // =========================================================

    public async Task<Job?> GetJobByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _context.Jobs
            .Include(job => job.Company)
            .FirstOrDefaultAsync(
                job => job.Id == id,
                cancellationToken);
    }


    // =========================================================
    // Get Company Specific Job
    // =========================================================

    public async Task<Job?> GetCompanyJobAsync(
        Guid companyId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        return await _context.Jobs
            .Include(job => job.Company)
            .FirstOrDefaultAsync(
                job =>
                    job.Id == jobId &&
                    job.CompanyId == companyId,
                cancellationToken);
    }


    // =========================================================
    // Add Job
    // =========================================================

    public async Task AddJobAsync(
        Job job,
        CancellationToken cancellationToken)
    {
        await _context.Jobs.AddAsync(
            job,
            cancellationToken);
    }


    // =========================================================
    // Update Job
    // =========================================================

    public Task UpdateJobAsync(
        Job job,
        CancellationToken cancellationToken)
    {
        _context.Jobs.Update(job);

        return Task.CompletedTask;
    }


    // =========================================================
    // Delete Job
    // =========================================================

    public Task DeleteJobAsync(
        Job job,
        CancellationToken cancellationToken)
    {
        _context.Jobs.Remove(job);

        return Task.CompletedTask;
    }


    // =========================================================
    // Save Changes
    // =========================================================

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}