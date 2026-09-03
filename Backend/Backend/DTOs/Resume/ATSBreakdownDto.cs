namespace Backend.DTOs.Resume;

public sealed class ATSBreakdownDto
{
    public double ATSScore { get; set; }

    public double SkillsMatch { get; set; }

    public double ExperienceMatch { get; set; }

    public double EducationMatch { get; set; }

    public double ProjectMatch { get; set; }

    public double CertificationMatch { get; set; }

    public double SummaryMatch { get; set; }

    public double StructureMatch { get; set; }

    public double JobDescriptionMatch { get; set; }

    public List<string> MissingSkills { get; set; }
        = new();

    public List<string> Suggestions { get; set; }
        = new();
}