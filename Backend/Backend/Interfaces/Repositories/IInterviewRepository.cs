using Backend.Models;

namespace Backend.Interfaces.Repositories;

public interface IInterviewRepository
{
    // ==========================================
    // Create
    // ==========================================

    Task AddAsync(
        Interview interview,
        CancellationToken cancellationToken);

    // ==========================================
    // Get
    // ==========================================

    Task<Interview?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<Interview?> GetByApplicationIdAsync(
        Guid applicationId,
        CancellationToken cancellationToken);

    // ==========================================
    // Company
    // ==========================================

    Task<IEnumerable<Interview>> GetByCompanyIdAsync(
        Guid companyId,
        CancellationToken cancellationToken);

    // ==========================================
    // Candidate
    // ==========================================

    Task<IEnumerable<Interview>> GetByCandidateIdAsync(
        Guid candidateId,
        CancellationToken cancellationToken);

    Task<bool> ExistsForCompanyAsync(
        Guid interviewId,
        Guid companyId,
        CancellationToken cancellationToken);

    Task<bool> ExistsForCandidateAsync(
        Guid interviewId,
        Guid candidateId,
        CancellationToken cancellationToken);

    // ==========================================
    // Update
    // ==========================================

    void Update(
        Interview interview);

    // ==========================================
    // Delete
    // ==========================================

    void Delete(
        Interview interview);

    // ==========================================
    // Save Changes
    // ==========================================

    Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken);
}