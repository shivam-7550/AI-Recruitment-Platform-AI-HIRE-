namespace Backend.Models;

public class Resume
{
    // =====================================================
    // Primary Key
    // =====================================================

    public Guid Id { get; set; }

    // =====================================================
    // User Reference
    // =====================================================

    public Guid UserId { get; set; }

    // =====================================================
    // Resume File Details
    // =====================================================

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    // =====================================================
    // Full Extracted Resume Content
    // =====================================================

    public string ResumeText { get; set; } = string.Empty;

    // =====================================================
    // Skills
    // =====================================================

    public string ExtractedSkills { get; set; } = string.Empty;

    // =====================================================
    // Professional Summary
    // =====================================================

    public string ProfessionalSummary { get; set; } = string.Empty;

    // =====================================================
    // Experience
    // =====================================================

    public int ExperienceYears { get; set; }

    // =====================================================
    // Education
    // =====================================================

    public string EducationDetails { get; set; } = string.Empty;

    // =====================================================
    // Projects
    // =====================================================

    public string Projects { get; set; } = string.Empty;

    // =====================================================
    // Certifications
    // =====================================================

    public string Certifications { get; set; } = string.Empty;

    // =====================================================
    // General Resume ATS Score
    // =====================================================

    public double ATSScore { get; set; }

    // =====================================================
    // Metadata
    // =====================================================

    public DateTime UploadedAt { get; set; } =
        DateTime.UtcNow;

    // =====================================================
    // Navigation
    // =====================================================

    public User User { get; set; } = null!;
}