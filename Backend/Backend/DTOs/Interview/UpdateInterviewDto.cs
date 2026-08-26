namespace Backend.DTOs.Interview;

public class UpdateInterviewDto
{
    // ==========================================
    // Interview Details
    // ==========================================

    public string Round { get; set; } = string.Empty;

    public string InterviewType { get; set; } = string.Empty;

    public DateTime ScheduledAt { get; set; }

    public int DurationMinutes { get; set; }

    // ==========================================
    // Online / Offline Details
    // ==========================================

    public string? MeetingLink { get; set; }

    public string? Location { get; set; }

    // ==========================================
    // Instructions
    // ==========================================

    public string? Instructions { get; set; }
}
