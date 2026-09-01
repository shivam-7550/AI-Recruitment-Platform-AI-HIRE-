
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // =====================================================
    // DbSets
    // =====================================================

    public DbSet<User> Users { get; set; }

    public DbSet<Company> Companies { get; set; }

    public DbSet<Job> Jobs { get; set; }

    public DbSet<Resume> Resumes { get; set; }

    public DbSet<JobApplication> JobApplications { get; set; }

    public DbSet<Notification> Notifications { get; set; }

    public DbSet<UserProfile> UserProfiles { get; set; }

    public DbSet<SavedJob> SavedJobs { get; set; }

    public DbSet<RefreshToken> RefreshTokens { get; set; }

    public DbSet<UserSettings> UserSettings { get; set; }

    public DbSet<Interview> Interviews { get; set; } = null!;


    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =================================================
        // User Email Unique
        // =================================================

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();


        // =================================================
        // User - Company
        // One User has One Company
        // =================================================

        modelBuilder.Entity<Company>()
            .HasOne(c => c.User)
            .WithOne(u => u.Company)
            .HasForeignKey<Company>(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);


        // =================================================
        // Company - Jobs
        // One Company has Many Jobs
        // =================================================

        modelBuilder.Entity<Job>()
            .HasOne(j => j.Company)
            .WithMany(c => c.Jobs)
            .HasForeignKey(j => j.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Job Salary Precision
        // =================================================

        modelBuilder.Entity<Job>()
            .Property(j => j.Salary)
            .HasPrecision(18, 2);


        // =================================================
        // User - Resume
        // One User has Many Resume records
        // =================================================

        modelBuilder.Entity<Resume>()
            .HasOne(r => r.User)
            .WithMany(u => u.Resumes)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // User - Job Applications
        // One User has Many Applications
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .HasOne(a => a.User)
            .WithMany(u => u.Applications)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Job - Applications
        // One Job has Many Applications
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .HasOne(a => a.Job)
            .WithMany(j => j.Applications)
            .HasForeignKey(a => a.JobId)
            .OnDelete(DeleteBehavior.Cascade);


        // =====================================================
        // Interview - Job Application
        // One Application can have Many Interviews
        //
        // NoAction avoids SQL Server multiple cascade
        // path problems through User / Job.
        // =====================================================

        modelBuilder.Entity<Interview>()
            .HasOne(i => i.Application)
            .WithMany()
            .HasForeignKey(i => i.ApplicationId)
            .OnDelete(DeleteBehavior.NoAction);


        // =================================================
        // Resume - Job Applications
        //
        // NoAction avoids SQL Server multiple cascade
        // path problems.
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .HasOne(a => a.Resume)
            .WithMany()
            .HasForeignKey(a => a.ResumeId)
            .OnDelete(DeleteBehavior.NoAction);


        // =================================================
        // Job Application - Unique Application
        // One Candidate can apply only once for the same Job
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .HasIndex(a => new
            {
                a.UserId,
                a.JobId
            })
            .IsUnique();


        // =================================================
        // Job Application - Name
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(150);


        // =================================================
        // Job Application - Email
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Email)
            .IsRequired()
            .HasMaxLength(200);


        // =================================================
        // Job Application - Contact
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Contact)
            .IsRequired()
            .HasMaxLength(20);


        // =================================================
        // Job Application - Qualification
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Qualification)
            .IsRequired()
            .HasMaxLength(150);


        // =================================================
        // Job Application - Course
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Course)
            .IsRequired()
            .HasMaxLength(150);


        // =================================================
        // Job Application - College Name
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.CollegeName)
            .IsRequired()
            .HasMaxLength(200);


        // =================================================
        // Job Application - Skills
        // Stored as comma-separated string
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Skills)
            .IsRequired()
            .HasMaxLength(1000);


        // =================================================
        // Job Application - Experience
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Experience)
            .IsRequired();


        // =================================================
        // Job Application - Status
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.Status)
            .IsRequired()
            .HasMaxLength(50);


        // =================================================
        // Job Application - ATS Score
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.ATSScore)
            .IsRequired();


        // =================================================
        // Job Application - Applied At
        // =================================================

        modelBuilder.Entity<JobApplication>()
            .Property(a => a.AppliedAt)
            .IsRequired();


        // =================================================
        // Notification - User
        // =================================================

        modelBuilder.Entity<Notification>()
            .HasOne(notification => notification.User)
            .WithMany(user => user.Notifications)
            .HasForeignKey(notification => notification.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Notification - Job
        // =================================================

        modelBuilder.Entity<Notification>()
            .HasOne(notification => notification.Job)
            .WithMany()
            .HasForeignKey(notification => notification.JobId)
            .OnDelete(DeleteBehavior.SetNull);


        // =================================================
        // UserProfile - User
        // One User has One Profile
        // =================================================

        modelBuilder.Entity<UserProfile>()
            .HasOne(profile => profile.User)
            .WithOne(user => user.Profile)
            .HasForeignKey<UserProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Saved Job - Unique
        // =================================================

        modelBuilder.Entity<SavedJob>()
            .HasIndex(saved => new
            {
                saved.UserId,
                saved.JobId
            })
            .IsUnique();


        // =================================================
        // Saved Job - User
        // =================================================

        modelBuilder.Entity<SavedJob>()
            .HasOne(saved => saved.User)
            .WithMany(user => user.SavedJobs)
            .HasForeignKey(saved => saved.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Saved Job - Job
        // =================================================

        modelBuilder.Entity<SavedJob>()
            .HasOne(saved => saved.Job)
            .WithMany(job => job.SavedByUsers)
            .HasForeignKey(saved => saved.JobId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // Refresh Token - Unique Hash
        // =================================================

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(token => token.TokenHash)
            .IsUnique();


        // =================================================
        // Refresh Token - User
        // =================================================

        modelBuilder.Entity<RefreshToken>()
            .HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // =================================================
        // User Settings
        // =================================================

        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasIndex(x => x.UserId)
                .IsUnique();

            entity.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<UserSettings>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

