namespace Backend.DTOs.Resume;

public class CompanyCandidateAIAnalysisDto
{
    public string Summary { get; set; } = string.Empty;

    public List<string> Strengths { get; set; } = new();

    public List<string> MissingSkills { get; set; } = new();

    public List<string> Suggestions { get; set; } = new();

    public List<string> InterviewFocus { get; set; } = new();
}
