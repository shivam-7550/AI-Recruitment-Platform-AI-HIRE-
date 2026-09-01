using Backend.DTOs.Notification;

namespace Backend.Interfaces.Services;

public interface INotificationService
{
    // =========================================================
    // Job Posted
    // =========================================================

    Task NotifyJobPostedAsync(
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken);

    // =========================================================
    // Application Submitted - Company
    // =========================================================

    Task NotifyApplicationSubmittedAsync(
        Guid companyUserId,
        Guid jobId,
        string jobTitle,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken);

    Task NotifyApplicationSubmittedAsync(
        Guid jobId,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken);

    // =========================================================
    // Application Submitted - Candidate
    // =========================================================

    Task NotifyCandidateApplicationSubmittedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken);

    // =========================================================
    // Application Status Changed
    // =========================================================

    Task NotifyCandidateApplicationStatusChangedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        string status,
        CancellationToken cancellationToken);

    // =========================================================
    // Interview Scheduled - Candidate
    // =========================================================

    Task NotifyCandidateInterviewScheduledAsync(
        Guid candidateUserId,
        Guid applicationId,
        Guid jobId,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime scheduledAt,
        string interviewType,
        string? meetingLink,
        CancellationToken cancellationToken);

    // =========================================================
    // Interview Scheduled - Admin
    // =========================================================

    Task NotifyAdminsInterviewScheduledAsync(
        Guid candidateUserId,
        Guid applicationId,
        Guid jobId,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime scheduledAt,
        string interviewType,
        string? meetingLink,
        CancellationToken cancellationToken);

    // =========================================================
    // Company Registered
    // =========================================================

    Task NotifyAdminsCompanyRegisteredAsync(
        Guid companyUserId,
        string companyName,
        CancellationToken cancellationToken);

    // =========================================================
    // Company Approval
    // =========================================================

    Task NotifyCompanyApprovalAsync(
        Guid companyUserId,
        string companyName,
        string status,
        string? reason,
        CancellationToken cancellationToken);

    // =========================================================
    // Get Notifications
    // =========================================================

    Task<IEnumerable<NotificationDto>> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    // =========================================================
    // Mark As Read
    // =========================================================

    Task<bool> MarkAsReadAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken);

    // =========================================================
    // Mark All As Read
    // =========================================================

    Task MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken);

    // =========================================================
    // Clear All
    // =========================================================

    Task ClearAllAsync(
        Guid userId,
        CancellationToken cancellationToken);
}