using Backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class UserProfile : BaseEntity
{
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [MaxLength(20)] 
    public string? Phone { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(500)] 
    public string? Bio { get; set; }

    [MaxLength(250)] 
    public string? Address { get; set; }
    [MaxLength(100)] 
    public string? City { get; set; }
    [MaxLength(100)] 
    public string? Country { get; set; }

    [MaxLength(500)] 
    public string? PhotoUrl { get; set; }

    [MaxLength(150)] 
    public string? Degree { get; set; }
    [MaxLength(150)] 
    public string? FieldOfStudy { get; set; }
    [MaxLength(200)] 
    public string? Institution { get; set; }
    public int? GraduationYear { get; set; }

    [MaxLength(180)] 
    public string? ProfessionalHeadline { get; set; }
    public int? ExperienceYears { get; set; }

    [MaxLength(150)] 
    public string? CurrentCompany { get; set; }

    [MaxLength(150)] public string? CurrentJobTitle { get; set; }
    [MaxLength(150)] public string? PreferredJobTitle { get; set; }
    [MaxLength(50)] public string? EmploymentType { get; set; }
    [MaxLength(100)] public string? PreferredLocation { get; set; }
    [MaxLength(50)] public string? WorkMode { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ExpectedSalary { get; set; }

    [MaxLength(1000)] 
    public string? Skills { get; set; }
    [MaxLength(500)] 
    public string? Languages { get; set; }

    [MaxLength(1500)]
    public string? InternshipDetails { get; set; }

    [MaxLength(300)]
    public string? LinkedInUrl { get; set; }
    [MaxLength(300)]
    public string? PortfolioUrl { get; set; }

    [MaxLength(300)] public string? GithubUrl { get; set; }
}
