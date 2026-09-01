namespace Backend.DTOs.Resume;

public class ResumeAIAnalysisDto
{
    // =====================================================
    // AI Resume Analysis
    // =====================================================

    public string Summary { get; set; } =
        string.Empty;

    public List<string> Strengths { get; set; } =
        new();

    public List<string> MissingSkills { get; set; } =
        new();

    public List<string> Suggestions { get; set; } =
        new();


    // =====================================================
    // ATS SCORE
    // =====================================================

    public double ATSScore { get; set; }

    public double SkillsMatch { get; set; }

    public double ExperienceMatch { get; set; }

    public double EducationMatch { get; set; }

    public double ProjectMatch { get; set; }

    public double JobDescriptionMatch { get; set; }


    // =====================================================
    // MATCHED SKILLS
    // =====================================================

    public List<string> MatchedSkills { get; set; } =
        new();
}