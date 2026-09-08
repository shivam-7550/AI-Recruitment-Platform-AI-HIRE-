namespace Backend.DTOs.AdminReports
{
    public class JobByCompanyDto
    {
        // ==========================================
        // Company
        // ==========================================

        public Guid CompanyId { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        // ==========================================
        // Job Metrics
        // ==========================================

        public int JobsPosted { get; set; }

        public int ActiveJobs { get; set; }

        public int Applications { get; set; }
    }
}
