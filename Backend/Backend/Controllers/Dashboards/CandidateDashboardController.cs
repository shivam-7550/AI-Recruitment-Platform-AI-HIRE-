using Backend.Constants;
using Backend.Data;
using Backend.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Dashboards;

[ApiController]
[Route("api/dashboards/candidate")]
[Authorize(Roles = Roles.User)]
public sealed class CandidateDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CandidateDashboardController(
        ApplicationDbContext db)
    {
        _db = db;
    }


    [HttpGet]
    public async Task<ActionResult<CandidateDashboardDto>> Get(
        CancellationToken cancellationToken)
    {
        // =====================================================
        // Current User
        // =====================================================

        if (!Guid.TryParse(
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier),
                out var userId))
        {
            return Unauthorized();
        }


        // =====================================================
        // Candidate
        // =====================================================

        var user =
            await _db.Users
                .AsNoTracking()
                .Include(x => x.Profile)
                .Include(x => x.Resumes)
                .FirstOrDefaultAsync(
                    x => x.Id == userId,
                    cancellationToken);

        if (user == null)
            return NotFound();


        // =====================================================
        // Applications
        // =====================================================

        var applications =
            await _db.JobApplications
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Include(x => x.Job)
                    .ThenInclude(x => x.Company)
                .OrderByDescending(
                    x => x.AppliedAt)
                .ToListAsync(
                    cancellationToken);


        // =====================================================
        // Saved Jobs
        // =====================================================

        var savedJobIds =
            await _db.SavedJobs
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.JobId)
                .ToListAsync(
                    cancellationToken);


        // =====================================================
        // Recommended Jobs
        // =====================================================

        var now =
            DateTime.UtcNow;

        var jobs =
            await _db.Jobs
                .AsNoTracking()
                .Where(x =>
                    x.IsActive &&
                    x.LastDateToApply >= now)
                .Include(x => x.Company)
                .OrderByDescending(
                    x => x.CreatedAt)
                .Take(12)
                .ToListAsync(
                    cancellationToken);


        // =====================================================
        // Profile Score
        // =====================================================

        var profileScore =
            CalculateProfileScore(user);


        // =====================================================
        // Latest Resume
        // =====================================================

        var resume =
            user.Resumes
                .OrderByDescending(
                    x => x.UploadedAt)
                .FirstOrDefault();


        // =====================================================
        // Resume ATS Breakdown
        // =====================================================

        var resumeBreakdown =
            CalculateResumeBreakdown(resume);


        // =====================================================
        // Dashboard Response
        // =====================================================

        var response =
            new CandidateDashboardDto
            {
                Candidate =
                    new CandidateInfoDto
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        PhotoUrl =
                            user.Profile?.PhotoUrl
                    },


                Stats =
                    new CandidateStatsDto
                    {
                        AppliedJobs =
                            applications.Count,

                        Interviews =
                            applications.Count(
                                x =>
                                    x.Status.Contains(
                                        "Interview",
                                        StringComparison
                                            .OrdinalIgnoreCase)),

                        SavedJobs =
                            savedJobIds.Count,

                        ProfileScore =
                            profileScore.Total
                    },


                ProfileCompletion =
                    new CandidateProfileCompletionDto
                    {
                        Total =
                            profileScore.Total,

                        Breakdown =
                            profileScore.Breakdown
                    },


                Resume =
                    resume == null
                        ? null
                        : new ResumeDashboardDto
                        {
                            Id = resume.Id,

                            FileName =
                                resume.FileName,

                            FilePath =
                                resume.FilePath,

                            UploadedAt =
                                resume.UploadedAt,

                            // IMPORTANT:
                            // This is the general
                            // resume ATS score.
                            AtsScore =
                                resume.ATSScore,

                            ScoreBreakdown =
                                resumeBreakdown
                        },


                RecommendedJobs =
                    jobs
                        .Select(
                            job =>
                                new RecommendedJobDto
                                {
                                    Id = job.Id,

                                    Title =
                                        job.Title,

                                    CompanyName =
                                        job.Company.CompanyName,

                                    Location =
                                        job.Location,

                                    Salary =
                                        job.Salary,

                                    EmploymentType =
                                        job.EmploymentType,

                                    Experience =
                                        job.Experience,

                                    Skills =
                                        job.Skills,

                                    IsSaved =
                                        savedJobIds.Contains(
                                            job.Id),

                                    HasApplied =
                                        applications.Any(
                                            a =>
                                                a.JobId ==
                                                job.Id)
                                })
                        .ToList(),


                RecentApplications =
                    applications
                        .Take(8)
                        .Select(
                            application =>
                                new RecentApplicationDto
                                {
                                    Id =
                                        application.Id,

                                    JobId =
                                        application.JobId,

                                    JobTitle =
                                        application.Job.Title,

                                    CompanyName =
                                        application.Job
                                            .Company
                                            .CompanyName,

                                    Status =
                                        application.Status,

                                    // This is the
                                    // job-specific
                                    // matching score.
                                    ATSScore =
                                        application.ATSScore,

                                    AppliedAt =
                                        application.AppliedAt
                                })
                        .ToList()
            };


        return Ok(response);
    }


    // =====================================================
    // PROFILE SCORE
    // =====================================================

    private static CandidateProfileCompletionDto
        CalculateProfileScore(
            Backend.Models.User user)
    {
        var profile =
            user.Profile;

        var breakdown =
            new Dictionary<string, int>
            {
                ["personalInfo"] =
                    !string.IsNullOrWhiteSpace(
                        user.Name) &&
                    !string.IsNullOrWhiteSpace(
                        user.Email) &&
                    !string.IsNullOrWhiteSpace(
                        profile?.Phone) &&
                    !string.IsNullOrWhiteSpace(
                        profile?.City)
                        ? 20
                        : 0,

                ["professionalSummary"] =
                    !string.IsNullOrWhiteSpace(
                        profile?.ProfessionalHeadline) &&
                    !string.IsNullOrWhiteSpace(
                        profile?.Bio)
                        ? 15
                        : 0,

                ["experience"] =
                    profile?.ExperienceYears != null &&
                    (!string.IsNullOrWhiteSpace(
                        profile.CurrentCompany) ||
                     !string.IsNullOrWhiteSpace(
                        profile.InternshipDetails))
                        ? 20
                        : 0,

                ["education"] =
                    !string.IsNullOrWhiteSpace(
                        profile?.Degree) &&
                    !string.IsNullOrWhiteSpace(
                        profile?.Institution) &&
                    profile.GraduationYear != null
                        ? 15
                        : 0,

                ["skills"] =
                    Split(
                        profile?.Skills)
                    .Length >= 3
                        ? 15
                        : 0,

                ["links"] =
                    !string.IsNullOrWhiteSpace(
                        profile?.LinkedInUrl)
                        ? 5
                        : 0,

                ["portfolio"] =
                    !string.IsNullOrWhiteSpace(
                        profile?.PortfolioUrl)
                        ? 5
                        : 0,

                ["photo"] =
                    !string.IsNullOrWhiteSpace(
                        profile?.PhotoUrl)
                        ? 5
                        : 0
            };

        return new CandidateProfileCompletionDto
        {
            Total =
                breakdown.Values.Sum(),

            Breakdown =
                breakdown
        };
    }


    // =====================================================
    // RESUME ATS BREAKDOWN
    // =====================================================

    private static Dictionary<string, double>
        CalculateResumeBreakdown(
            Backend.Models.Resume? resume)
    {
        if (resume == null)
        {
            return new Dictionary<string, double>();
        }

        var text =
            resume.ResumeText ??
            string.Empty;

        var breakdown =
            new Dictionary<string, double>
            {
                ["contactDetails"] =
                    HasEmail(
                        resume,
                        text)
                        ? 15
                        : 0,

                ["skills"] =
                    Math.Min(
                        Split(
                            resume.ExtractedSkills)
                            .Length * 5,
                        30),

                ["experience"] =
                    resume.Experience > 0 ||
                    Has(
                        text,
                        "experience",
                        "internship")
                        ? 20
                        : 0,

                ["education"] =
                    !string.IsNullOrWhiteSpace(
                        resume.Education) ||
                    Has(
                        text,
                        "education",
                        "university",
                        "college",
                        "degree")
                        ? 15
                        : 0,

                ["projects"] =
                    Has(
                        text,
                        "project",
                        "projects")
                        ? 10
                        : 0,

                ["certifications"] =
                    Has(
                        text,
                        "certification",
                        "certificate",
                        "certified")
                        ? 5
                        : 0,

                ["formatting"] =
                    FormattingScore(text)
            };

        return breakdown;
    }


    private static bool HasEmail(
        Backend.Models.Resume resume,
        string text)
    {
        return
            !string.IsNullOrWhiteSpace(
                resume.Email)
            ||
            System.Text.RegularExpressions.Regex
                .IsMatch(
                    text,
                    @"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b");
    }


    private static double FormattingScore(
        string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        var words =
            System.Text.RegularExpressions.Regex
                .Matches(
                    text,
                    @"\b\w+\b")
                .Count;

        return words is >= 150 and <= 1500
            ? 5
            : 2.5;
    }


    private static string[] Split(
        string? value)
    {
        return (value ?? string.Empty)
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries |
                StringSplitOptions.TrimEntries);
    }


    private static bool Has(
        string text,
        params string[] values)
    {
        return values.Any(
            value =>
                text.Contains(
                    value,
                    StringComparison
                        .OrdinalIgnoreCase));
    }
}