namespace Backend.DTOs.AdminReports
{
    public class CompanyPerformanceDto
    {
        public Guid CompanyId { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        public int JobsPosted { get; set; }

        public int ActiveJobs { get; set; }

        public int Applications { get; set; }

        public int Shortlisted { get; set; }

        public int Interviews { get; set; }
    }
}