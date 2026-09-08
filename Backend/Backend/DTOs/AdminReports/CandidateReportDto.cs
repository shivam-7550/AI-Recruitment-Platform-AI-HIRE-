namespace Backend.DTOs.AdminReports
{
    public class CandidateReportDto
    {
        // ==========================================
        // Candidate Statistics
        // ==========================================

        public int TotalRegisteredCandidates { get; set; }

        public int NewCandidates { get; set; }

        public int CandidatesWithResume { get; set; }

        public int CandidatesWithoutResume { get; set; }

        public int CandidatesWhoApplied { get; set; }

        public int CandidatesWhoSavedJobs { get; set; }

        public int ActiveCandidates { get; set; }

        public int InactiveCandidates { get; set; }

        // ==========================================
        // Registration Trend
        // ==========================================

        public List<ReportTrendDto> RegistrationTrend { get; set; }
            = new();
    }
}