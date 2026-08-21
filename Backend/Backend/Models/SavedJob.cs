using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class SavedJob : BaseEntity
{
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
    public Guid JobId { get; set; }
    [ForeignKey(nameof(JobId))] public Job Job { get; set; } = null!;
}
