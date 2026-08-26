using Backend.Constants;


namespace Backend.Models;

public class Interview
{
    // ==========================================
    // Primary Key
    // ==========================================

    public Guid Id { get; set; }

    // ==========================================
    // Application
    // ==========================================

    public Guid ApplicationId { get; set; }

    // ==========================================
    // Interview Details
    // ==========================================

    public string Round { get; set; } = string.Empty;

    public string InterviewType { get; set; } = string.Empty;

    public DateTime ScheduledAt { get; set; }

    public int DurationMinutes { get; set; }

    public string? MeetingLink { get; set; }

    public string? Location { get; set; }

    public string? Instructions { get; set; }

    // ==========================================
    // Status
    // ==========================================

    public InterviewStatus Status { get; set; }

    // ==========================================
    // Audit
    // ==========================================

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // ==========================================
    // Navigation Property
    // ==========================================

    public JobApplication Application { get; set; } = null!;
}
