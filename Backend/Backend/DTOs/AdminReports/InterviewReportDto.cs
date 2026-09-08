namespace Backend.DTOs.AdminReports
{
    public class InterviewReportDto
    {
        // ==========================================
        // Overall Interview Statistics
        // ==========================================

        public int TotalInterviews { get; set; }

        public int Scheduled { get; set; }

        public int Rescheduled { get; set; }

        public int Completed { get; set; }

        public int Cancelled { get; set; }

        public int NoShow { get; set; }

        public int UpcomingInterviews { get; set; }

        // ==========================================
        // Trend
        // ==========================================

        public List<ReportTrendDto> Trend { get; set; }
            = new();

        // ==========================================
        // Company-wise Interviews
        // ==========================================

        public List<InterviewByCompanyDto> InterviewsByCompany
        { get; set; }
            = new();
    }
}