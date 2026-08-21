namespace Backend.DTOs.Application;

public class ApplicationResponseDto
{
    // ==========================================
    // Application
    // ==========================================

    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid JobId { get; set; }

    // ==========================================
    // Job Information
    // ==========================================

    public string JobTitle { get; set; } = string.Empty;

    public string CompanyName { get; set; } = string.Empty;

    // ==========================================
    // Candidate Information
    // ==========================================

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Contact { get; set; } = string.Empty;

    // ==========================================
    // Education
    // ==========================================

    public string Qualification { get; set; } = string.Empty;

    public string Course { get; set; } = string.Empty;

    public string CollegeName { get; set; } = string.Empty;

    // ==========================================
    // Skills
    // ==========================================

    public List<string> Skills { get; set; } = new();

    // ==========================================
    // Experience
    // ==========================================

    public int Experience { get; set; }

    // ==========================================
    // Application Status
    // ==========================================

    public string Status { get; set; } = string.Empty;

    // ==========================================
    // ATS
    // ==========================================

    public double ATSScore { get; set; }

    public DateTime AppliedAt { get; set; }

    public Guid? ResumeId { get; set; }

    public string? ResumeFileName { get; set; }

    public string? ResumeUrl { get; set; }
}