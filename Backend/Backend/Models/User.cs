namespace Backend.Models
{
    public class User : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();

        public ICollection<Resume> Resumes { get; set; } = new List<Resume>();

        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public Company? Company { get; set; }

        public UserProfile? Profile { get; set; }
    }
}
