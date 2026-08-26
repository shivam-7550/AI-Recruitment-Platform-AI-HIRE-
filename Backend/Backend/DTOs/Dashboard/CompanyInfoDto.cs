namespace Backend.DTOs.Dashboard;

public class CompanyInfoDto
{
    public Guid Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public string ApprovalStatus { get; set; } = string.Empty;
}
