namespace Backend.DTOs.Dashboard;

public  class CandidateDashboardDto
{
    public CandidateInfoDto Candidate { get; set; } = new();

    public CandidateStatsDto Stats { get; set; } = new();

    public CandidateProfileCompletionDto ProfileCompletion { get; set; } = new();

    public ResumeDashboardDto? Resume { get; set; }

    public List<RecommendedJobDto> RecommendedJobs { get; set; } = new();

    public List<RecentApplicationDto> RecentApplications { get; set; } = new();
}
