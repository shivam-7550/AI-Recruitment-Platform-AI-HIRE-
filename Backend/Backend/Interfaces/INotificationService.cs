using Backend.DTOs.Notification;

namespace Backend.Interfaces;

public interface INotificationService
{
    // =========================================================
    // Job Posted
    // Candidate + Admin
    // =========================================================

    Task NotifyJobPostedAsync(
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken);


    // =========================================================
    // Application Submitted
    // Company
    // =========================================================

    Task NotifyApplicationSubmittedAsync(
        Guid companyUserId,
        Guid jobId,
        string jobTitle,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken);


    // =========================================================
    // Application Submitted By Job
    // Resolves Company UserId from Job
    // =========================================================

    Task NotifyApplicationSubmittedAsync(
        Guid jobId,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken);


    // =========================================================
    // Candidate - Application Submitted
    // =========================================================

    Task NotifyCandidateApplicationSubmittedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken);


    // =========================================================
    // Candidate - Application Status Changed
    // =========================================================

    Task NotifyCandidateApplicationStatusChangedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        string status,
        CancellationToken cancellationToken);


    // =========================================================
    // Admin - Company Registered
    // =========================================================

    Task NotifyAdminsCompanyRegisteredAsync(
        Guid companyUserId,
        string companyName,
        CancellationToken cancellationToken);


    // =========================================================
    // Company - Approval Status
    // =========================================================

    Task NotifyCompanyApprovalAsync(
        Guid companyUserId,
        string companyName,
        string status,
        string? reason,
        CancellationToken cancellationToken);


    // =========================================================
    // Get Current User Notifications
    // =========================================================

    Task<IEnumerable<NotificationDto>> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);


    // =========================================================
    // Mark Single Notification As Read
    // =========================================================

    Task<bool> MarkAsReadAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken);


    // =========================================================
    // Mark All Notifications As Read
    // =========================================================

    Task MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken);


    // =========================================================
    // Clear All Notifications
    // =========================================================

    Task ClearAllAsync(
        Guid userId,
        CancellationToken cancellationToken);
}