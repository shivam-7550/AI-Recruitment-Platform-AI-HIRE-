namespace Backend.DTOs.Resume;

public sealed class ResumeParsedDataDto
{
    public List<string> Skills { get; set; }
        = new();

    public int ExperienceYears { get; set; }

    public List<string> Education { get; set; }
        = new();

    public List<string> Projects { get; set; }
        = new();

    public List<string> Certifications { get; set; }
        = new();

    public string ProfessionalSummary { get; set; }
        = string.Empty;
}