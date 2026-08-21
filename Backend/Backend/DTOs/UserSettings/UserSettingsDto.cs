namespace Backend.DTOs.UserSettings;

public class UserSettingsDto
{
    public bool EmailNotifications { get; set; }

    public bool ApplicationUpdates { get; set; }

    public bool JobAlerts { get; set; }

    public bool RecruiterMessages { get; set; }

    public bool MarketingEmails { get; set; }

    public bool WeeklyJobDigest { get; set; }

    public bool ApplicationStatusNotifications { get; set; }

    public bool ProfileVisibility { get; set; }

    public bool ShowContactInformation { get; set; }

    public bool AllowRecruiterSearch { get; set; }
}