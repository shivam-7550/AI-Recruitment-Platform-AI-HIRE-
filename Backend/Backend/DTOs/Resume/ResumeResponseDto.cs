namespace Backend.DTOs.Resume;

public sealed class ResumeResponseDto
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; }

    public double ATSScore { get; set; }
}