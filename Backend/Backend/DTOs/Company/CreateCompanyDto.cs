namespace Backend.DTOs.Company
{
    public class CreateCompanyDto
    {
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

        // Existing User who owns this company
        public Guid UserId { get; set; }
    }
}
