namespace Backend.DTOs.Resume;

public sealed class ResumeAIAnalysisDto
{
    // ==========================================
    // AI Analysis
    // ==========================================

    public string Summary { get; set; }
        = string.Empty;

    public List<string> Strengths { get; set; }
        = new();

    public List<string> MatchedSkills { get; set; }
        = new();

    public List<string> MissingSkills { get; set; }
        = new();

    public List<string> Suggestions { get; set; }
        = new();

    // ==========================================
    // AI ATS Evaluation
    // ==========================================

    public double ATSScore { get; set; }

    public double SkillsMatch { get; set; }

    public double ExperienceMatch { get; set; }

    public double EducationMatch { get; set; }

    public double ProjectMatch { get; set; }

    public double CertificationMatch { get; set; }

    public double JobDescriptionMatch { get; set; }
}