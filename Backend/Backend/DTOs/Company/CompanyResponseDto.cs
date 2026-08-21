namespace Backend.DTOs.Company
{
    public class CompanyResponseDto
    {
        public Guid Id { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Website { get; set; }

        public string? Industry { get; set; }

        public string? Description { get; set; }

        public string? LogoUrl { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? State { get; set; }

        public string? Country { get; set; }

        public bool IsActive { get; set; }

        public string ApprovalStatus { get; set; } = "Pending";

        public DateTime? ApprovedAt { get; set; }

        public string? RejectionReason { get; set; }

        public Guid UserId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
