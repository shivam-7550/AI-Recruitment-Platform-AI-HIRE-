namespace Backend.DTOs.Application;

public sealed class JobMatchScoreDto
{
    public double Score { get; set; }

    public Dictionary<string, double> Breakdown { get; set; } = new();
}