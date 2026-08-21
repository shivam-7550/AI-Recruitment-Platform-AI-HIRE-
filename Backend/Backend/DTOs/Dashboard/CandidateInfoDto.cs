namespace Backend.DTOs.Dashboard;

public  class CandidateInfoDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }
}