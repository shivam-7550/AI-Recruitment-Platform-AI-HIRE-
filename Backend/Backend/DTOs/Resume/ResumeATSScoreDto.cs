namespace Backend.DTOs.Resume;

public sealed class ResumeATSScoreDto
{
    public double ATSScore { get; set; }

    public List<string> MatchedSkills { get; set; } = new();

    public List<string> MissingSkills { get; set; } = new();

    public List<string> Strengths { get; set; } = new();

    public List<string> Suggestions { get; set; } = new();
}

