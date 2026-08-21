namespace Backend.DTOs.Dashboard
{
    public class CompanyDashboardDto
    {
        public object? Company { get; set; }

        public CompanyStatsDto Stats { get; set; } = new();

        public List<CompanyJobDto> Jobs { get; set; } = new();

        public List<RecentApplicationDto> RecentApplications { get; set; } = new();
    }
}