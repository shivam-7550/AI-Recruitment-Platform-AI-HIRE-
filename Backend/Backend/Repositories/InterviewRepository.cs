using Backend.Data;
using Backend.Interfaces;
using Backend.Models;

using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class InterviewRepository : IInterviewRepository
{
    private readonly ApplicationDbContext _context;

    public InterviewRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ==========================================
    // Create
    // ==========================================

    public async Task AddAsync(
        Interview interview,
        CancellationToken cancellationToken)
    {
        await _context.Interviews.AddAsync(
            interview,
            cancellationToken);
    }

    // ==========================================
    // Get By Id
    // ==========================================

    public async Task<Interview?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
            .FirstOrDefaultAsync(
                i => i.Id == id,
                cancellationToken);
    }

    // ==========================================
    // Get By Application Id
    // ==========================================

    public async Task<Interview?> GetByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
            .Where(i => i.ApplicationId == applicationId)
            .OrderByDescending(i => i.ScheduledAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    // ==========================================
    // Get By Company Id
    // ==========================================

    public async Task<IEnumerable<Interview>> GetByCompanyIdAsync(
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
            .ThenInclude(a => a.Job)
            .Where(i => i.Application.Job.CompanyId == companyId)
            .OrderBy(i => i.ScheduledAt)
            .ToListAsync(cancellationToken);
    }

    // ==========================================
    // Get By Candidate Id
    // ==========================================

    public async Task<IEnumerable<Interview>> GetByCandidateIdAsync(
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
            .ThenInclude(a => a.Job)
            .Where(i => i.Application.UserId == candidateId)
            .OrderByDescending(i => i.ScheduledAt)
            .ToListAsync(cancellationToken);
    }

    // ==========================================
    // Update
    // ==========================================

    public void Update(Interview interview)
    {
        _context.Interviews.Update(interview);
    }

    // ==========================================
    // Save Changes
    // ==========================================

    public async Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        return await _context.SaveChangesAsync(
            cancellationToken) > 0;
    }
}