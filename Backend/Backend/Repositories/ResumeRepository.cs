using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class ResumeRepository : IResumeRepository
{
    private readonly ApplicationDbContext _context;

    public ResumeRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // =====================================================
    // Get Resume By User
    // =====================================================

    public async Task<Resume?> GetResumeByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Resumes
            .OrderByDescending(x => x.UploadedAt)
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);
    }

    // =====================================================
    // Add Resume
    // =====================================================

    public async Task AddResumeAsync(
        Resume resume,
        CancellationToken cancellationToken)
    {
        await _context.Resumes.AddAsync(
            resume,
            cancellationToken);
    }

    // =====================================================
    // Update Resume
    // =====================================================

    public Task UpdateResumeAsync(
        Resume resume,
        CancellationToken cancellationToken)
    {
        _context.Resumes.Update(resume);

        return Task.CompletedTask;
    }

    // =====================================================
    // Delete Resume
    // =====================================================

    public Task DeleteResumeAsync(
        Resume resume,
        CancellationToken cancellationToken)
    {
        _context.Resumes.Remove(resume);

        return Task.CompletedTask;
    }

    // =====================================================
    // Save Changes
    // =====================================================

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}