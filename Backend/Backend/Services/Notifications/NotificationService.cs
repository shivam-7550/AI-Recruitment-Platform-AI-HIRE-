using Backend.Constants;
using Backend.Data;
using Backend.DTOs.Notification;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Notifications;

public sealed class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationRepository _repository;

    public NotificationService(
        ApplicationDbContext context,
        INotificationRepository repository)
    {
        _context = context;
        _repository = repository;
    }

    // =========================================================
    // JOB POSTED NOTIFICATION
    // Candidate + Admin
    // =========================================================

    public async Task NotifyJobPostedAsync(
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken)
    {
        var recipients =
            await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.Role == Roles.User ||
                    user.Role == Roles.Admin)
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

        if (recipients.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;

        var notifications =
            recipients.Select(userId =>
                new Notification
                {
                    Id = Guid.NewGuid(),

                    UserId = userId,

                    JobId = jobId,

                    Title = "New job posted",

                    Message =
                        $"{companyName} posted a new {jobTitle} position.",

                    Type = "JobPosted",

                    IsRead = false,

                    IsArchived = false,

                    CreatedAt = now
                })
                .ToList();

        await _repository.AddRangeAsync(
            notifications,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // APPLICATION SUBMITTED NOTIFICATION
    // Company
    // =========================================================

    public async Task NotifyApplicationSubmittedAsync(
        Guid companyUserId,
        Guid jobId,
        string jobTitle,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken)
    {
        var applicantName =
            await _context.Users
                .AsNoTracking()
                .Where(user => user.Id == applicantUserId)
                .Select(user => user.Name)
                .FirstOrDefaultAsync(cancellationToken)
            ?? "A candidate";

        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId = companyUserId,

                JobId = jobId,

                Title = "New job application",

                Message =
                    $"{applicantName} applied for {jobTitle}. " +
                    $"ATS score: {Math.Round(atsScore)}%.",

                Type = "ApplicationSubmitted",

                IsRead = false,

                IsArchived = false,

                CreatedAt = DateTime.UtcNow
            };

        await _repository.AddRangeAsync(
            new[] { notification },
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // APPLICATION SUBMITTED NOTIFICATION BY JOB
    // Resolves Company UserId
    // =========================================================

    public async Task NotifyApplicationSubmittedAsync(
        Guid jobId,
        Guid applicantUserId,
        double atsScore,
        CancellationToken cancellationToken)
    {
        var job =
            await _context.Jobs
                .AsNoTracking()
                .Where(job => job.Id == jobId)
                .Select(job => new
                {
                    JobId = job.Id,

                    JobTitle = job.Title,

                    CompanyUserId =
                        job.Company != null
                            ? job.Company.UserId
                            : Guid.Empty
                })
                .FirstOrDefaultAsync(
                    cancellationToken);

        if (job is null ||
            job.CompanyUserId == Guid.Empty)
        {
            return;
        }

        await NotifyApplicationSubmittedAsync(
            job.CompanyUserId,
            job.JobId,
            job.JobTitle,
            applicantUserId,
            atsScore,
            cancellationToken);
    }

    // =========================================================
    // CANDIDATE APPLICATION SUBMITTED
    // =========================================================

    public async Task NotifyCandidateApplicationSubmittedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        CancellationToken cancellationToken)
    {
        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId = candidateUserId,

                JobId = jobId,

                Title = "Application submitted",

                Message =
                    $"Your application for {jobTitle} at " +
                    $"{companyName} was submitted successfully.",

                Type = "ApplicationSubmittedCandidate",

                IsRead = false,

                IsArchived = false,

                CreatedAt = DateTime.UtcNow
            };

        await _repository.AddRangeAsync(
            new[] { notification },
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // CANDIDATE APPLICATION STATUS CHANGED
    // =========================================================

    public async Task NotifyCandidateApplicationStatusChangedAsync(
        Guid candidateUserId,
        Guid jobId,
        string jobTitle,
        string companyName,
        string status,
        CancellationToken cancellationToken)
    {
        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId = candidateUserId,

                JobId = jobId,

                Title = "Application status updated",

                Message =
                    $"Your application for {jobTitle} at " +
                    $"{companyName} is now {status}.",

                Type = "ApplicationStatusChanged",

                IsRead = false,

                IsArchived = false,

                CreatedAt = DateTime.UtcNow
            };

        await _repository.AddRangeAsync(
            new[] { notification },
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // CANDIDATE - INTERVIEW SCHEDULED
    // =========================================================

    public async Task NotifyCandidateInterviewScheduledAsync(
        Guid candidateUserId,
        Guid applicationId,
        Guid jobId,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime scheduledAt,
        string interviewType,
        string? meetingLink,
        CancellationToken cancellationToken)
    {
        var localDateTime =
            scheduledAt.ToLocalTime();

        var dateText =
            localDateTime.ToString("dd MMM yyyy");

        var timeText =
            localDateTime.ToString("hh:mm tt");

        var message =
            $"Hello {candidateName}, your interview for " +
            $"{jobTitle} at {companyName} has been scheduled " +
            $"on {dateText} at {timeText}. " +
            $"Interview type: {interviewType}.";

        if (!string.IsNullOrWhiteSpace(meetingLink))
        {
            message +=
                $" Meeting link: {meetingLink}";
        }

        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId = candidateUserId,

                JobId = jobId,

                Title = "Interview scheduled",

                Message = message,

                Type = "InterviewScheduled",

                IsRead = false,

                IsArchived = false,

                CreatedAt = DateTime.UtcNow
            };

        await _repository.AddRangeAsync(
            new[] { notification },
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // ADMIN - INTERVIEW SCHEDULED
    // Sends notification to ALL admins
    // =========================================================

    public async Task NotifyAdminsInterviewScheduledAsync(
        Guid candidateUserId,
        Guid applicationId,
        Guid jobId,
        string candidateName,
        string jobTitle,
        string companyName,
        DateTime scheduledAt,
        string interviewType,
        string? meetingLink,
        CancellationToken cancellationToken)
    {
        var adminIds =
            await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.Role == Roles.Admin)
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

        if (adminIds.Count == 0)
        {
            return;
        }

        var localDateTime =
            scheduledAt.ToLocalTime();

        var dateText =
            localDateTime.ToString("dd MMM yyyy");

        var timeText =
            localDateTime.ToString("hh:mm tt");

        var message =
            $"{companyName} scheduled an interview with " +
            $"{candidateName} for {jobTitle} on " +
            $"{dateText} at {timeText}. " +
            $"Interview type: {interviewType}.";

        if (!string.IsNullOrWhiteSpace(meetingLink))
        {
            message +=
                $" Meeting link: {meetingLink}";
        }

        var now =
            DateTime.UtcNow;

        var notifications =
            adminIds
                .Select(adminId =>
                    new Notification
                    {
                        Id = Guid.NewGuid(),

                        UserId = adminId,

                        JobId = jobId,

                        Title = "New interview scheduled",

                        Message = message,

                        Type = "InterviewScheduledAdmin",

                        IsRead = false,

                        IsArchived = false,

                        CreatedAt = now
                    })
                .ToList();

        await _repository.AddRangeAsync(
            notifications,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // ADMIN - COMPANY REGISTERED
    // =========================================================

    public async Task NotifyAdminsCompanyRegisteredAsync(
        Guid companyUserId,
        string companyName,
        CancellationToken cancellationToken)
    {
        var adminIds =
            await _context.Users
                .AsNoTracking()
                .Where(user =>
                    user.Role == Roles.Admin)
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

        if (adminIds.Count == 0)
        {
            return;
        }

        var now =
            DateTime.UtcNow;

        var notifications =
            adminIds.Select(adminId =>
                new Notification
                {
                    Id = Guid.NewGuid(),

                    UserId = adminId,

                    Title = "Company approval required",

                    Message =
                        $"{companyName} submitted a company " +
                        "profile for verification.",

                    Type = "CompanyRegistered",

                    IsRead = false,

                    IsArchived = false,

                    CreatedAt = now
                })
                .ToList();

        await _repository.AddRangeAsync(
            notifications,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // COMPANY APPROVAL
    // =========================================================

    public async Task NotifyCompanyApprovalAsync(
        Guid companyUserId,
        string companyName,
        string status,
        string? reason,
        CancellationToken cancellationToken)
    {
        var isApproved =
            status.Equals(
                "Approved",
                StringComparison.OrdinalIgnoreCase);

        var message =
            isApproved
                ? $"{companyName} is approved. " +
                  "You can now publish jobs."
                : $"{companyName} was not approved. " +
                  $"{reason ?? "Please contact the administrator."}";

        var notification =
            new Notification
            {
                Id = Guid.NewGuid(),

                UserId = companyUserId,

                Title =
                    $"Company {status.ToLowerInvariant()}",

                Message = message,

                Type =
                    $"Company{status}",

                IsRead = false,

                IsArchived = false,

                CreatedAt = DateTime.UtcNow
            };

        await _repository.AddRangeAsync(
            new[] { notification },
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // GET CURRENT USER NOTIFICATIONS
    // =========================================================

    public async Task<IEnumerable<NotificationDto>>
        GetForUserAsync(
            Guid userId,
            CancellationToken cancellationToken)
    {
        var items =
            await _repository.GetByUserAsync(
                userId,
                cancellationToken);

        return items.Select(
            item =>
                new NotificationDto
                {
                    Id = item.Id,

                    Title = item.Title,

                    Message = item.Message,

                    Type = item.Type,

                    IsRead = item.IsRead,

                    IsArchived = item.IsArchived,

                    JobId = item.JobId,

                    CreatedAt = item.CreatedAt
                });
    }

    // =========================================================
    // MARK AS READ
    // =========================================================

    public async Task<bool> MarkAsReadAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var item =
            await _repository.GetByIdAsync(
                id,
                userId,
                cancellationToken);

        if (item is null)
        {
            return false;
        }

        item.IsRead = true;

        item.UpdatedAt =
            DateTime.UtcNow;

        await _repository.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    public async Task MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var items =
            await _repository.GetUnreadByUserAsync(
                userId,
                cancellationToken);

        if (items.Count == 0)
        {
            return;
        }

        var now =
            DateTime.UtcNow;

        foreach (var item in items)
        {
            item.IsRead = true;

            item.UpdatedAt = now;
        }

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    // =========================================================
    // CLEAR ALL
    // =========================================================

    public async Task ClearAllAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var items =
            await _repository.GetActiveByUserAsync(
                userId,
                cancellationToken);

        if (items.Count == 0)
        {
            return;
        }

        var now =
            DateTime.UtcNow;

        foreach (var item in items)
        {
            item.IsArchived = true;

            item.UpdatedAt = now;
        }

        await _repository.SaveChangesAsync(
            cancellationToken);
    }
}