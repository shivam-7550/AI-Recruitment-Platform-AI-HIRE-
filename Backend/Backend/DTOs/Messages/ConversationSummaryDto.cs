namespace Backend.DTOs.Messages;

public class ConversationSummaryDto
{
    public Guid ConversationId { get; set; }

    public Guid CandidateId { get; set; }

    public string CandidateName { get; set; } = string.Empty;

    public string? CandidateProfileImage { get; set; }

    public Guid ApplicationId { get; set; }

    public string JobTitle { get; set; } = string.Empty;

    public string ApplicationStatus { get; set; } = string.Empty;

    public string? LastMessage { get; set; }

    public DateTime? LastMessageAt { get; set; }

    public int UnreadCount { get; set; }

    public bool IsArchived { get; set; }
}