namespace Backend.DTOs.Notification;

public sealed class NotificationDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public bool IsArchived { get; set; }

    public Guid? JobId { get; set; }

    public DateTime CreatedAt { get; set; }
}

