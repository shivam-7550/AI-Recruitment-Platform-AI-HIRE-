namespace Backend.DTOs.AdminReports
{
    public class AtsReportDto
    {
        // ==========================================
        // Resume ATS Metrics
        // ==========================================

        public int ResumesAnalyzed { get; set; }

        public double AverageResumeATS { get; set; }

        // ==========================================
        // Application ATS Metrics
        // ==========================================

        public int ApplicationsAnalyzed { get; set; }

        public double AverageApplicationATS { get; set; }

        // ==========================================
        // ATS Score Distribution
        // ==========================================

        public int Above80 { get; set; }

        public int Between60And80 { get; set; }

        public int Below60 { get; set; }
    }
}