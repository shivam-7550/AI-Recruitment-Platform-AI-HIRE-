namespace Backend.DTOs.Messages;

public class ConversationDto
{
    public Guid ConversationId { get; set; }

    public Guid CompanyId { get; set; }

    public Guid CandidateId { get; set; }

    public string CandidateName { get; set; } = string.Empty;

    public Guid ApplicationId { get; set; }

    public string JobTitle { get; set; } = string.Empty;

    public string ApplicationStatus { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsArchived { get; set; }
}