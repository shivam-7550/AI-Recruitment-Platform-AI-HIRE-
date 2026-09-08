namespace Backend.DTOs.AdminReports
{
    public class PlatformOverviewReportDto
    {
        // ==========================================
        // Lifetime Totals
        // ==========================================

        public int TotalCandidates { get; set; }

        public int TotalCompanies { get; set; }

        public int ApprovedCompanies { get; set; }

        public int PendingCompanies { get; set; }

        public int RejectedCompanies { get; set; }

        public int TotalJobs { get; set; }

        public int ActiveJobs { get; set; }

        public int ExpiredJobs { get; set; }

        public int TotalApplications { get; set; }

        public int TotalInterviews { get; set; }

        // ==========================================
        // Selected Period Activity
        // ==========================================

        public int NewCandidates { get; set; }

        public int NewCompanies { get; set; }

        public int NewJobs { get; set; }

        public int NewApplications { get; set; }

        public int NewInterviews { get; set; }
    }
}