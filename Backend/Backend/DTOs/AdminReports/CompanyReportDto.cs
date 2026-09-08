namespace Backend.DTOs.AdminReports
{
    public class CompanyReportDto
    {
        // ==========================================
        // Company Statistics
        // ==========================================

        public int TotalCompanies { get; set; }

        public int ApprovedCompanies { get; set; }

        public int PendingCompanies { get; set; }

        public int RejectedCompanies { get; set; }

        public int NewCompanies { get; set; }

        public int ActiveCompanies { get; set; }

        public int CompaniesWithJobs { get; set; }

        public int CompaniesWithApplications { get; set; }

        // ==========================================
        // Registration Trend
        // ==========================================

        public List<ReportTrendDto> RegistrationTrend { get; set; }
            = new();
    }
}