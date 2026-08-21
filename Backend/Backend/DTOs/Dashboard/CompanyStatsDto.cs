namespace Backend.DTOs.Dashboard;

public class CompanyStatsDto
{
    public int TotalJobs { get; set; }

    public int ActiveJobs { get; set; }

    public int TotalApplications { get; set; }

    public int NewApplications { get; set; }
}