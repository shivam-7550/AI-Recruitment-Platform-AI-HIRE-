using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class JobApplication
{
    public Guid Id { get; set; }


    // =====================================================
    // Relationships
    // =====================================================

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;


    public Guid JobId { get; set; }

    public Job Job { get; set; } = null!;


    // =====================================================
    // Resume Relationship
    // =====================================================

    public Guid? ResumeId { get; set; }

    public Resume? Resume { get; set; }

    public string? ResumeFileName { get; set; }

    public string? ResumeFilePath { get; set; }

    public string? ResumeText { get; set; }

    public string? ResumeExtractedSkills { get; set; }
    public DateTime? ResumeUploadedAt { get; set; }


    // =====================================================
    // Application Form Details
    // =====================================================

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;


    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;


    [Required]
    [MaxLength(20)]
    public string Contact { get; set; } = string.Empty;


    [Required]
    [MaxLength(150)]
    public string Qualification { get; set; } = string.Empty;


    [Required]
    [MaxLength(150)]
    public string Course { get; set; } = string.Empty;


    [Required]
    [MaxLength(200)]
    public string CollegeName { get; set; } = string.Empty;


    // =====================================================
    // Skills
    // Stored as comma-separated values
    // =====================================================

    [Required]
    [MaxLength(1000)]
    public string Skills { get; set; } = string.Empty;


    // =====================================================
    // Experience
    // =====================================================

    public int Experience { get; set; }


    // =====================================================
    // Application Information
    // =====================================================

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Applied";


    public double ATSScore { get; set; }

    public double SkillsMatch { get; set; }

    public double ExperienceMatch { get; set; }

    public double EducationMatch { get; set; }

    public double ProjectMatch { get; set; }

    public double CertificationMatch { get; set; }

    public double SummaryMatch { get; set; }

    public double StructureMatch { get; set; }

    public double JobDescriptionMatch { get; set; }


    public DateTime AppliedAt { get; set; }
}
