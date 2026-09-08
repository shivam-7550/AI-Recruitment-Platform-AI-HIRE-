namespace Backend.DTOs.AdminReports
{
    public class JobReportDto
    {
        // ==========================================
        // Overall Job Statistics
        // ==========================================

        public int TotalJobs { get; set; }

        public int ActiveJobs { get; set; }

        public int ExpiredJobs { get; set; }

        public int JobsCreatedDuringPeriod { get; set; }

        // ==========================================
        // Company-wise Job Statistics
        // ==========================================

        public List<JobByCompanyDto> JobsByCompany { get; set; }
            = new();
    }
}