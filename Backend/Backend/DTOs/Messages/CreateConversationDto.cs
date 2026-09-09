using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Messages;

public class CreateConversationDto
{
    [Required]
    public Guid CandidateId { get; set; }

    [Required]
    public Guid ApplicationId { get; set; }
}