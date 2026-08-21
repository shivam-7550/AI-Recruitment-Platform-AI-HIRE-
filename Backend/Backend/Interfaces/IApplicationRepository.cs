using Backend.Models;

namespace Backend.Interfaces;

public interface IApplicationRepository
{
    // ==========================================
    // Create
    // ==========================================

    Task AddApplicationAsync(
        JobApplication application,
        CancellationToken cancellationToken);

    // ==========================================
    // Candidate
    // ==========================================

    Task<JobApplication?> GetApplicationByUserAndJobAsync(
        Guid userId,
        Guid jobId,
        CancellationToken cancellationToken);

    Task<IEnumerable<JobApplication>> GetApplicationsByUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    // ==========================================
    // Company
    // ==========================================

    Task<IEnumerable<JobApplication>> GetApplicationsByJobAsync(
        Guid companyId,
        Guid jobId,
        CancellationToken cancellationToken);

    Task<JobApplication?> GetCompanyApplicationByIdAsync(
        Guid companyId,
        Guid applicationId,
        CancellationToken cancellationToken);

    // ==========================================
    // Save
    // ==========================================

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
