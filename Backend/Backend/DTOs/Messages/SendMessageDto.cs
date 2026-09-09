using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Messages;

public class SendMessageDto
{
    [Required]
    public Guid ConversationId { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
}