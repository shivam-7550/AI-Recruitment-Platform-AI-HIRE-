namespace Backend.DTOs.Dashboard
{
    public class CompanyJobDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime LastDateToApply { get; set; }

        public int ApplicationCount { get; set; }
    }
}
