using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Notification : BaseEntity
    {
        [Required, MaxLength(180)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Type { get; set; } = "JobPosted";

        public bool IsRead { get; set; }

        public bool IsArchived { get; set; }

        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        public Guid? JobId { get; set; }

        [ForeignKey(nameof(JobId))]
        public Job? Job { get; set; }
    }
}
