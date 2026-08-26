namespace Backend.Models;

public class UserSettings : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    // Notifications
    public bool EmailNotifications { get; set; } = true;

    public bool ApplicationUpdates { get; set; } = true;

    public bool JobAlerts { get; set; } = true;

    public bool RecruiterMessages { get; set; } = true;

    public bool MarketingEmails { get; set; } = false;

    public bool WeeklyJobDigest { get; set; } = true;

    public bool ApplicationStatusNotifications { get; set; } = true;

    // Privacy
    public bool ProfileVisibility { get; set; } = true;
    public bool ResumeVisibility { get; set; }
    public bool RecruiterSearchable { get; set; }

    public bool PersonalizedJobRecommendations { get; set; }

    public bool ShowContactInformation { get; set; } = false;

    public bool AllowRecruiterSearch { get; set; } = true;
}
