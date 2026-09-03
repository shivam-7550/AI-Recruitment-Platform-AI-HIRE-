using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Job;

public class UpdateJobDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(3000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Location { get; set; } = string.Empty;

    [Range(1, double.MaxValue)]
    public decimal Salary { get; set; }

    [Range(0, 50)]
    public int Experience { get; set; }

    [Required]
    [MaxLength(100)]
    public string EmploymentType { get; set; } = string.Empty;

    // Required Skills
    [Required]
    [MaxLength(500)]
    public string Skills { get; set; } = string.Empty;

    // ATS Enhancements

    [MaxLength(500)]
    public string PreferredSkills { get; set; } = string.Empty;

    [MaxLength(500)]
    public string EducationRequirements { get; set; } = string.Empty;

    [MaxLength(500)]
    public string CertificationRequirements { get; set; } = string.Empty;

    public bool RequiresPortfolio { get; set; }

    [Range(1, 10000)]
    public int Vacancies { get; set; }

    [Required]
    public DateTime LastDateToApply { get; set; }

    public bool IsActive { get; set; }
}