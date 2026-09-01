using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;

using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class InterviewRepository : IInterviewRepository
{
    private readonly ApplicationDbContext _context;

    public InterviewRepository(
        ApplicationDbContext context)
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
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
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
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Where(i =>
                i.ApplicationId == applicationId)
            .OrderByDescending(
                i => i.ScheduledAt)
            .FirstOrDefaultAsync(
                cancellationToken);
    }

    // ==========================================
    // Get By Company Id
    // ==========================================

    public async Task<IEnumerable<Interview>>
        GetByCompanyIdAsync(
            Guid companyId,
            CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Where(i =>
                i.Application.Job.CompanyId ==
                companyId)
            .OrderBy(
                i => i.ScheduledAt)
            .ToListAsync(
                cancellationToken);
    }

    // ==========================================
    // Get By Candidate Id
    // ==========================================

    public async Task<IEnumerable<Interview>>
        GetByCandidateIdAsync(
            Guid candidateId,
            CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Job)
                    .ThenInclude(j => j.Company)
            .Where(i =>
                i.Application.UserId ==
                candidateId)
            .OrderByDescending(
                i => i.ScheduledAt)
            .ToListAsync(
                cancellationToken);
    }

    // ==========================================
    // Exists For Company
    // ==========================================

    public async Task<bool> ExistsForCompanyAsync(
        Guid interviewId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .AnyAsync(
                i =>
                    i.Id == interviewId &&
                    i.Application.Job.CompanyId ==
                    companyId,
                cancellationToken);
    }

    // ==========================================
    // Exists For Candidate
    // ==========================================

    public async Task<bool> ExistsForCandidateAsync(
        Guid interviewId,
        Guid candidateId,
        CancellationToken cancellationToken)
    {
        return await _context.Interviews
            .AnyAsync(
                i =>
                    i.Id == interviewId &&
                    i.Application.UserId ==
                    candidateId,
                cancellationToken);
    }

    // ==========================================
    // Update
    // ==========================================

    public void Update(
        Interview interview)
    {
        _context.Interviews.Update(
            interview);
    }

    // ==========================================
    // Delete
    // ==========================================

    public void Delete(
        Interview interview)
    {
        _context.Interviews.Remove(
            interview);
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