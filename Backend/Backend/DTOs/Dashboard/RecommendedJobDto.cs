namespace Backend.DTOs.Dashboard
{
    public class RecommendedJobDto
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public decimal Salary { get; set; }

        public string EmploymentType { get; set; } = string.Empty;

        public int Experience { get; set; }

        public string Skills { get; set; } = string.Empty;

        public bool IsSaved { get; set; }

        public bool HasApplied { get; set; }
    }
}