using Backend.Constants;
using Backend.Models;

namespace Backend.DTOs.Company
{
    public class InterviewStatusDto
    {
        public Guid Id { get; set; }

        public Guid ApplicationId { get; set; }

        public string Round { get; set; } = string.Empty;

        public string InterviewType { get; set; } = string.Empty;

        public DateTime ScheduledAt { get; set; }

        public int DurationMinutes { get; set; }

        public string? MeetingLink { get; set; }

        public string? Instructions { get; set; }

        public InterviewStatus Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public JobApplication Application { get; set; } = null!;
    }
}
