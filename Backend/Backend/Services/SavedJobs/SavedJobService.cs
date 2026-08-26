using Backend.Data;
using Backend.DTOs.SavedJob;
using Backend.Interfaces.Services;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.SavedJobs;

public sealed class SavedJobService : ISavedJobService
{
    private readonly ApplicationDbContext _context;

    public SavedJobService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SavedJobResponseDto>> GetSavedJobsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.SavedJobs
            .AsNoTracking()
            .Include(saved => saved.Job)
                .ThenInclude(job => job.Company)
            .Where(saved => saved.UserId == userId)
            .OrderByDescending(saved => saved.CreatedAt)
            .Select(saved => new SavedJobResponseDto
            {
                Id = saved.Id,
                JobId = saved.JobId,
                CreatedAt = saved.CreatedAt,

                Title = saved.Job.Title,
                Description = saved.Job.Description,
                Location = saved.Job.Location,
                Salary = saved.Job.Salary,
                Experience = saved.Job.Experience,
                EmploymentType = saved.Job.EmploymentType,
                Skills = saved.Job.Skills,
                Vacancies = saved.Job.Vacancies,
                LastDateToApply = saved.Job.LastDateToApply,
                IsActive = saved.Job.IsActive,

                CompanyId = saved.Job.CompanyId,
                CompanyName = saved.Job.Company.CompanyName
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SaveJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var jobExists = await _context.Jobs
            .AsNoTracking()
            .AnyAsync(
                job => job.Id == jobId &&
                       job.IsActive,
                cancellationToken);

        if (!jobExists)
            return false;

        var alreadySaved = await _context.SavedJobs
            .AnyAsync(
                saved =>
                    saved.UserId == userId &&
                    saved.JobId == jobId,
                cancellationToken);

        if (alreadySaved)
            return true;

        var savedJob = new SavedJob
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            JobId = jobId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.SavedJobs.AddAsync(
            savedJob,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<bool> RemoveSavedJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var savedJob = await _context.SavedJobs
            .FirstOrDefaultAsync(
                saved =>
                    saved.UserId == userId &&
                    saved.JobId == jobId,
                cancellationToken);

        if (savedJob == null)
            return false;

        _context.SavedJobs.Remove(savedJob);

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }
}
