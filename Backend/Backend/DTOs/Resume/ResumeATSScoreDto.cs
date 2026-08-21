namespace Backend.DTOs.Resume;

public sealed class ResumeATSScoreDto
{
    public double Score { get; set; }

    public Dictionary<string, double> Breakdown { get; set; } = new();
}