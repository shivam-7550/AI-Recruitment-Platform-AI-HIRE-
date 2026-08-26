namespace Backend.Models;

public class Resume
{
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
    // Extracted Resume Content
    // =====================================================

    public string ResumeText { get; set; } = string.Empty;


    // =====================================================
    // Candidate Information
    // =====================================================

    public string CandidateName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;


    // =====================================================
    // Skills
    // =====================================================

    public string ExtractedSkills { get; set; } = string.Empty;


    // =====================================================
    // Candidate Summary
    // =====================================================

    public string Summary { get; set; } = string.Empty;


    // =====================================================
    // Experience
    // =====================================================

    public int Experience { get; set; }


    // =====================================================
    // Education
    // =====================================================

    public string Education { get; set; } = string.Empty;


    // =====================================================
    // Current Job
    // =====================================================

    public string CurrentDesignation { get; set; } = string.Empty;


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
