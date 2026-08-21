using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Company : BaseEntity
    {
        [Required]
        [MaxLength(150)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Phone]
        public string? Phone { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }

        [MaxLength(100)]
        public string? Industry { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public string? LogoUrl { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? State { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        public bool IsActive { get; set; }

        [Required, MaxLength(20)]
        public string ApprovalStatus { get; set; } = "Pending";

        public DateTime? ApprovedAt { get; set; }

        public Guid? ApprovedByAdminId { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // Relation with User Table
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        // Navigation Property
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}
