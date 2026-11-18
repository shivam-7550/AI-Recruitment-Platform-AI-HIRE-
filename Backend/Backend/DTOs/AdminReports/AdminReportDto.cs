namespace Backend.DTOs.AdminReports
{
    public class AdminReportDto
    {
        public PlatformOverviewReportDto Overview { get; set; } = new();
        public CandidateReportDto Candidates { get; set; } = new();
        public CompanyReportDto Companies { get; set; } = new();
        public JobReportDto Jobs { get; set; } = new();
        public ApplicationReportDto Applications { get; set; } = new();
        public InterviewReportDto Interviews { get; set; } = new();
        public AtsReportDto ATS { get; set; } = new();
        public List<CompanyPerformanceDto> CompanyPerformance { get; set; }
            = new();
    }
}