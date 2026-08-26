namespace Backend.DTOs.Dashboard;

public class AdminStatsDto
{
    public int TotalUsers { get; set; }

    public int Candidates { get; set; }

    public int Companies { get; set; }

    public int ActiveJobs { get; set; }

    public int Applications { get; set; }

    public int PendingApprovals { get; set; }
}
