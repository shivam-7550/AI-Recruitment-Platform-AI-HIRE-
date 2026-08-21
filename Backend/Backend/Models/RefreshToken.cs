namespace Backend.Models;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;


    public string TokenHash { get; set; } = string.Empty;


    public DateTime ExpiresAt { get; set; }


    public DateTime? RevokedAt { get; set; }


    public string? ReplacedByTokenHash { get; set; }


    public string? CreatedByIp { get; set; }


    public bool IsActive =>
        RevokedAt == null &&
        ExpiresAt > DateTime.UtcNow;
}