namespace Backend.DTOs.Interview;

public class InterviewResponseDto
{
    // ==========================================
    // Interview
    // ==========================================

    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }

    // ==========================================
    // Candidate
    // ==========================================

    public Guid CandidateId { get; set; }

    public string CandidateName { get; set; } = string.Empty;

    public string CandidateEmail { get; set; } = string.Empty;

    // ==========================================
    // Job
    // ==========================================

    public Guid JobId { get; set; }

    public string JobTitle { get; set; } = string.Empty;

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

    public string Status { get; set; } = string.Empty;

    // ==========================================
    // Audit
    // ==========================================

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}