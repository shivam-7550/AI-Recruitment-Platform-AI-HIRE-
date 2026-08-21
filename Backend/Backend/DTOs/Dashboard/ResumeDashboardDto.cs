namespace Backend.DTOs.Dashboard;

public sealed class ResumeDashboardDto
{
    public Guid Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; }

    public double AtsScore { get; set; }

    public Dictionary<string, double> ScoreBreakdown { get; set; } = new();
}