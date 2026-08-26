namespace Backend.DTOs.Dashboard;

public  class RecentApplicationDto
{
    public Guid Id { get; set; }

    public Guid JobId { get; set; }

    public string JobTitle { get; set; } = string.Empty;

    public string CompanyName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    // Job-specific matching score
    public double? ATSScore { get; set; }

    public DateTime AppliedAt { get; set; }
}
