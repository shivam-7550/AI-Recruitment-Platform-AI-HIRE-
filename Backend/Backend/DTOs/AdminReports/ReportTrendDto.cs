namespace Backend.DTOs.AdminReports
{
    public class ReportTrendDto
    {
        // ==========================================
        // Trend Period
        // ==========================================

        public string Date { get; set; } = string.Empty;

        // ==========================================
        // Total Records On Date
        // ==========================================

        public int Count { get; set; }
    }
}