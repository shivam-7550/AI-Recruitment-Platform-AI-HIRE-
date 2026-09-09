using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }

    [ForeignKey(nameof(ConversationId))]
    public Conversation Conversation { get; set; } = null!;

    public Guid SenderId { get; set; }

    [ForeignKey(nameof(SenderId))]
    public User Sender { get; set; } = null!;

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;

    public bool IsRead { get; set; }
}