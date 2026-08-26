namespace Backend.DTOs.SavedJob;

public sealed class SavedJobResponseDto
{
    public Guid Id { get; set; }

    public Guid JobId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public decimal Salary { get; set; }

    public int Experience { get; set; }

    public string EmploymentType { get; set; } = string.Empty;

    public string Skills { get; set; } = string.Empty;

    public int Vacancies { get; set; }

    public DateTime LastDateToApply { get; set; }

    public bool IsActive { get; set; }

    public Guid CompanyId { get; set; }

    public string CompanyName { get; set; } = string.Empty;
}
