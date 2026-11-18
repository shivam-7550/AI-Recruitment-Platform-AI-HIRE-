namespace Backend.DTOs.Resume;

public class CompanyCandidateAIAnalysisDto
{
    public string AnalysisMode { get; set; } = "AI";

    // AI-generated semantic job fit score. 
    // This is NOT the existing ATS score.
    public int JobMatchScore { get; set; }
    public string Summary { get; set; } = string.Empty;

    public List<string> Strengths { get; set; } = new();

    public List<string> MatchedSkills { get; set; } = new();

    public List<string> MissingSkills { get; set; } = new();

    public List<string> Suggestions { get; set; } = new();

    public List<string> InterviewFocus { get; set; } = new();
}
