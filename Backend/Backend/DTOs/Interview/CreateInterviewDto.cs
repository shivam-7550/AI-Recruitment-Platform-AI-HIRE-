using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Interview;

public class CreateInterviewDto
{
    [Required]
    public Guid ApplicationId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Round { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string InterviewType { get; set; } = string.Empty;

    [Required]
    public DateTime ScheduledAt { get; set; }

    [Range(15, 480)]
    public int DurationMinutes { get; set; }

    [MaxLength(1000)]
    public string? MeetingLink { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    [MaxLength(2000)]
    public string? Instructions { get; set; }
}