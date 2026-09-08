namespace Backend.DTOs.AdminReports
{
    public class ApplicationReportDto
    {
        // ==========================================
        // Overall Application Statistics
        // ==========================================

        public int TotalApplications { get; set; }

        public int Applied { get; set; }

        public int UnderReview { get; set; }

        public int Shortlisted { get; set; }

        public int Interview { get; set; }

        public int Hired { get; set; }

        public int Rejected { get; set; }

        // ==========================================
        // Application Trend
        // ==========================================

        public List<ReportTrendDto> Trend { get; set; }
            = new();

        // ==========================================
        // Application Status Distribution
        // ==========================================

        public List<ApplicationStatusDistributionDto>
            Distribution
        { get; set; }
            = new();

        // ==========================================
        // Recruitment Funnel
        // ==========================================

        public List<ApplicationFunnelDto>
            Funnel
        { get; set; }
            = new();
    }
}