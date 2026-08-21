namespace Backend.DTOs.Dashboard
{
    public class PendingCompanyDto
    {
        public Guid Id { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? Industry { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}