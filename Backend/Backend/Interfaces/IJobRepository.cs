using Backend.Models;

namespace Backend.Interfaces;

public interface IJobRepository
{
    // =========================================================
    // Get All Jobs
    // =========================================================

    Task<IEnumerable<Job>> GetAllJobsAsync(
        CancellationToken cancellationToken);


    // =========================================================
    // Get Job By Id
    // =========================================================

    Task<Job?> GetJobByIdAsync(
        Guid id,
        CancellationToken cancellationToken);


    // =========================================================
    // Get Company Specific Job
    // =========================================================

    Task<Job?> GetCompanyJobAsync(
        Guid companyId,
        Guid jobId,
        CancellationToken cancellationToken);


    // =========================================================
    // Add Job
    // =========================================================

    Task AddJobAsync(
        Job job,
        CancellationToken cancellationToken);


    // =========================================================
    // Update Job
    // =========================================================

    Task UpdateJobAsync(
        Job job,
        CancellationToken cancellationToken);


    // =========================================================
    // Delete Job
    // =========================================================

    Task DeleteJobAsync(
        Job job,
        CancellationToken cancellationToken);


    // =========================================================
    // Save Changes
    // =========================================================

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}