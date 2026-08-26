using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Application;

public sealed class ApplyJobDto
{
    // ==========================================
    // Job
    // ==========================================

    [Required]
    public Guid JobId { get; set; }

    // ==========================================
    // Candidate Information
    // ==========================================

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

    // ==========================================
    // Education
    // ==========================================

    [Required]
    [MaxLength(150)]
    public string Qualification { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Course { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string CollegeName { get; set; } = string.Empty;

    // ==========================================
    // Skills
    // ==========================================

    [Required]
    [MinLength(1)]
    public List<string> Skills { get; set; } = new();

    // ==========================================
    // Experience
    // ==========================================

    [Range(0, 50)]
    public int Experience { get; set; }
}
