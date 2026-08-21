using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Job : BaseEntity
    {
        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(3000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public decimal Salary { get; set; }

        [Required]
        public int Experience { get; set; }

        [Required]
        [MaxLength(100)]
        public string EmploymentType { get; set; } = string.Empty;
        // Full Time, Part Time, Internship, Contract

        [Required]
        [MaxLength(500)]
        public string Skills { get; set; } = string.Empty;
        // Example: C#, ASP.NET Core, SQL Server, React

        [Required]
        public int Vacancies { get; set; }

        [Required]
        public DateTime LastDateToApply { get; set; }

        public bool IsActive { get; set; } = true;

        // Foreign Key
        [Required]
        public Guid CompanyId { get; set; }

        [ForeignKey(nameof(CompanyId))]
        public Company Company { get; set; } = null!;

        // Navigation Property
        public ICollection<JobApplication> Applications { get; set; }
            = new List<JobApplication>();
        public ICollection<SavedJob> SavedByUsers { get; set; } = new List<SavedJob>();
    }
}
