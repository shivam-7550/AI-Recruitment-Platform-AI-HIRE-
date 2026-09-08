namespace Backend.DTOs.AdminReports
{
    public class InterviewByCompanyDto
    {
        public Guid CompanyId { get; set; }

        public string CompanyName { get; set; }
            = string.Empty;

        public int TotalInterviews { get; set; }

        public int UpcomingInterviews { get; set; }

        public int CompletedInterviews { get; set; }
    }
}