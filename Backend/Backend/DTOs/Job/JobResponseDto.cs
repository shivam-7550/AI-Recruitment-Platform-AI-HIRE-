namespace Backend.DTOs.Job;

public class JobResponseDto
{
    public Guid Id { get; set; }

    public Guid CompanyId { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public decimal Salary { get; set; }

    public int Experience { get; set; }

    public string EmploymentType { get; set; } = string.Empty;

    // Required Skills
    public string Skills { get; set; } = string.Empty;

    // ATS Fields
    public string PreferredSkills { get; set; } = string.Empty;

    public string EducationRequirements { get; set; } = string.Empty;

    public string CertificationRequirements { get; set; } = string.Empty;

    public bool RequiresPortfolio { get; set; }

    public int Vacancies { get; set; }

    public DateTime LastDateToApply { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}