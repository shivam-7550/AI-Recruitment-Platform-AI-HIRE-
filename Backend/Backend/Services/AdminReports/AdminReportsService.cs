using Backend.Constants;
using Backend.Data;
using Backend.DTOs.AdminReports;
using Backend.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
namespace Backend.Services.AdminReports
{
    public class AdminReportsService : IAdminReportsService
    {
        private readonly ApplicationDbContext _context;
        public AdminReportsService(ApplicationDbContext context)
        {
            _context = context;
        }
        // ============================================================
        // MAIN REPORT
        // ============================================================
        public async Task<AdminReportDto> GetReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            if (from.HasValue && to.HasValue && from.Value > to.Value)
            {
                throw new ArgumentException(
                    "'from' date must be less than or equal to 'to' date.");
            }
            return new AdminReportDto
            {
                Overview = await GetOverviewAsync(
                    from,
                    to,
                    cancellationToken),
                Candidates = await GetCandidateReportAsync(
                    from,
                    to,
                    cancellationToken),
                Companies = await GetCompanyReportAsync(
                    from,
                    to,
                    cancellationToken),
                Jobs = await GetJobReportAsync(
                    from,
                    to,
                    cancellationToken),
                Applications = await GetApplicationReportAsync(
                    from,
                    to,
                    cancellationToken),
                 Interviews =
                     await GetInterviewReportAsync(
                         from,
                         to,
                         cancellationToken),
                ATS =
                     await GetAtsReportAsync(
                         cancellationToken),
                CompanyPerformance =
                     await GetCompanyPerformanceAsync(
                         cancellationToken)
            };
        }
        // ============================================================
        // DATE RANGE HELPERS
        // ============================================================
        private static IQueryable<T> ApplyDateFilter<T>(
            IQueryable<T> query,
            DateTime? from,
            DateTime? to,
            Func<T, DateTime> dateSelector)
        {
            if (from.HasValue)
            {
                var fromDate = from.Value.Date;
                query = query.Where(
                    x => dateSelector(x) >= fromDate);
            }
            if (to.HasValue)
            {
                var toDateExclusive = to.Value.Date.AddDays(1);
                query = query.Where(
                    x => dateSelector(x) < toDateExclusive);
            }
            return query;
        }
        // ============================================================
        // PLATFORM OVERVIEW
        // ============================================================
        private async Task<PlatformOverviewReportDto> GetOverviewAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var users = _context.Users.AsNoTracking();
            var companies = _context.Companies.AsNoTracking();
            var jobs = _context.Jobs.AsNoTracking();
            var applications = _context.JobApplications.AsNoTracking();
            var interviews = _context.Interviews.AsNoTracking();
            var candidates = users
                .Where(x => x.Role == Roles.User);
            var newCandidates = candidates
                .Where(x =>
                    (!from.HasValue || x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue || x.CreatedAt < to.Value.Date.AddDays(1)));
            var newCompanies = companies
                .Where(x =>
                    (!from.HasValue || x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue || x.CreatedAt < to.Value.Date.AddDays(1)));
            var newJobs = jobs
                .Where(x =>
                    (!from.HasValue || x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue || x.CreatedAt < to.Value.Date.AddDays(1)));
            var newApplications = applications
                .Where(x =>
                    (!from.HasValue || x.AppliedAt >= from.Value.Date) &&
                    (!to.HasValue || x.AppliedAt < to.Value.Date.AddDays(1)));
            var newInterviews = interviews
                .Where(x =>
                    (!from.HasValue || x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue || x.CreatedAt < to.Value.Date.AddDays(1)));
            return new PlatformOverviewReportDto
            {
                // ------------------------------------------
                // Candidates
                // ------------------------------------------
                TotalCandidates = await candidates.CountAsync(
                    cancellationToken),
                NewCandidates = await newCandidates.CountAsync(
                    cancellationToken),
                // ------------------------------------------
                // Companies
                // ------------------------------------------
                TotalCompanies = await companies.CountAsync(
                    cancellationToken),
                ApprovedCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Approved",
                    cancellationToken),
                PendingCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Pending",
                    cancellationToken),
                RejectedCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Rejected",
                    cancellationToken),
                NewCompanies = await newCompanies.CountAsync(
                    cancellationToken),
                // ------------------------------------------
                // Jobs
                // ------------------------------------------
                TotalJobs = await jobs.CountAsync(
                    cancellationToken),
                ActiveJobs = await jobs.CountAsync(
                    x => x.IsActive,
                    cancellationToken),
                ExpiredJobs = await jobs.CountAsync(
                    x => x.LastDateToApply < DateTime.UtcNow,
                    cancellationToken),
                NewJobs = await newJobs.CountAsync(
                    cancellationToken),
                // ------------------------------------------
                // Applications
                // ------------------------------------------
                TotalApplications = await applications.CountAsync(
                    cancellationToken),
                NewApplications = await newApplications.CountAsync(
                    cancellationToken),
                // ------------------------------------------
                // Interviews
                // ------------------------------------------
                TotalInterviews = await interviews.CountAsync(
                    cancellationToken),
                NewInterviews = await newInterviews.CountAsync(
                    cancellationToken)
            };
        }
        // ============================================================
        // CANDIDATE REPORT
        // ============================================================
        private async Task<CandidateReportDto> GetCandidateReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var candidates = _context.Users
                .AsNoTracking()
                .Where(x => x.Role == Roles.User);
            var totalCandidates = await candidates.CountAsync(
                cancellationToken);
            var newCandidates = await candidates
                .Where(x =>
                    (!from.HasValue ||
                     x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue ||
                     x.CreatedAt < to.Value.Date.AddDays(1)))
                .CountAsync(cancellationToken);
            var candidateIds = await candidates
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);
            var candidatesWithResume = await _context.Resumes
                .AsNoTracking()
                .Where(x => candidateIds.Contains(x.UserId))
                .Select(x => x.UserId)
                .Distinct()
                .CountAsync(cancellationToken);
            var candidatesWhoApplied = await _context.JobApplications
                .AsNoTracking()
                .Where(x => candidateIds.Contains(x.UserId))
                .Select(x => x.UserId)
                .Distinct()
                .CountAsync(cancellationToken);
            var candidatesWhoSavedJobs = await _context.SavedJobs
                .AsNoTracking()
                .Where(x => candidateIds.Contains(x.UserId))
                .Select(x => x.UserId)
                .Distinct()
                .CountAsync(cancellationToken);
            var activeCandidates = candidatesWhoApplied;
            // ------------------------------------------
            // Registration Trend
            // ------------------------------------------
            var trendData = await candidates
                .Where(x =>
                    (!from.HasValue ||
                     x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue ||
                     x.CreatedAt < to.Value.Date.AddDays(1)))
                .GroupBy(x => x.CreatedAt.Date)
                .Select(x => new
                {
                    Date = x.Key,
                    Count = x.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync(cancellationToken);
            var trend = trendData
                .Select(x => new ReportTrendDto
                {
                    Date = x.Date.ToString("yyyy-MM-dd"),
                    Count = x.Count
                })
                .ToList();
            return new CandidateReportDto
            {
                TotalRegisteredCandidates = totalCandidates,
                NewCandidates = newCandidates,
                CandidatesWithResume = candidatesWithResume,
                CandidatesWithoutResume =
                    Math.Max(
                        0,
                        totalCandidates - candidatesWithResume),
                CandidatesWhoApplied = candidatesWhoApplied,
                CandidatesWhoSavedJobs = candidatesWhoSavedJobs,
                ActiveCandidates = activeCandidates,
                InactiveCandidates =
                    Math.Max(
                        0,
                        totalCandidates - activeCandidates),
                RegistrationTrend = trend
            };
        }
        // ============================================================
        // COMPANY REPORT
        // ============================================================
        private async Task<CompanyReportDto> GetCompanyReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var companies = _context.Companies
                .AsNoTracking();
            var newCompanies = companies
                .Where(x =>
                    (!from.HasValue ||
                     x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue ||
                     x.CreatedAt < to.Value.Date.AddDays(1)));
            // ------------------------------------------
            // Registration Trend
            // ------------------------------------------
            var trendData = await newCompanies
                .GroupBy(x => x.CreatedAt.Date)
                .Select(x => new
                {
                    Date = x.Key,
                    Count = x.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync(cancellationToken);
            var trend = trendData
                .Select(x => new ReportTrendDto
                {
                    Date = x.Date.ToString("yyyy-MM-dd"),
                    Count = x.Count
                })
                .ToList();
            return new CompanyReportDto
            {
                TotalCompanies = await companies.CountAsync(
                    cancellationToken),
                ApprovedCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Approved",
                    cancellationToken),
                PendingCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Pending",
                    cancellationToken),
                RejectedCompanies = await companies.CountAsync(
                    x => x.ApprovalStatus == "Rejected",
                    cancellationToken),
                NewCompanies = await newCompanies.CountAsync(
                    cancellationToken),
                ActiveCompanies = await companies.CountAsync(
                    x => x.IsActive,
                    cancellationToken),
                CompaniesWithJobs = await companies.CountAsync(
                    x => x.Jobs.Any(),
                    cancellationToken),
                CompaniesWithApplications = await companies.CountAsync(
                    x => x.Jobs.Any(j => j.Applications.Any()),
                    cancellationToken),
                RegistrationTrend = trend
            };
        }
        // ============================================================
        // JOB REPORT
        // ============================================================
        private async Task<JobReportDto> GetJobReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var jobs = _context.Jobs
                .AsNoTracking();
            var jobsCreatedDuringPeriod = jobs
                .Where(x =>
                    (!from.HasValue ||
                     x.CreatedAt >= from.Value.Date) &&
                    (!to.HasValue ||
                     x.CreatedAt < to.Value.Date.AddDays(1)));
            // ------------------------------------------
            // Jobs By Company
            // ------------------------------------------
            var jobsByCompany = await _context.Companies
                .AsNoTracking()
                .Select(company => new JobByCompanyDto
                {
                    CompanyId = company.Id,
                    CompanyName = company.CompanyName,
                    JobsPosted = company.Jobs.Count(),
                    ActiveJobs = company.Jobs.Count(
                        job => job.IsActive),
                    Applications = company.Jobs
                        .SelectMany(job => job.Applications)
                        .Count()
                })
                .OrderByDescending(x => x.JobsPosted)
                .ToListAsync(cancellationToken);
            return new JobReportDto
            {
                TotalJobs = await jobs.CountAsync(
                    cancellationToken),
                ActiveJobs = await jobs.CountAsync(
                    x => x.IsActive,
                    cancellationToken),
                ExpiredJobs = await jobs.CountAsync(
                    x => x.LastDateToApply < DateTime.UtcNow,
                    cancellationToken),
                JobsCreatedDuringPeriod =
                    await jobsCreatedDuringPeriod.CountAsync(
                        cancellationToken),
                JobsByCompany = jobsByCompany
            };
        }
        // ============================================================
        // APPLICATION REPORT
        // ============================================================
        private async Task<ApplicationReportDto> GetApplicationReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var applications = _context.JobApplications
                .AsNoTracking();
            // IMPORTANT:
            // All application metrics now use the same date range.
            var filteredApplications = applications
                .Where(x =>
                    (!from.HasValue ||
                     x.AppliedAt >= from.Value.Date) &&
                    (!to.HasValue ||
                     x.AppliedAt < to.Value.Date.AddDays(1)));
            // ------------------------------------------
            // Trend
            // ------------------------------------------
            var trendData = await filteredApplications
                .GroupBy(x => x.AppliedAt.Date)
                .Select(x => new
                {
                    Date = x.Key,
                    Count = x.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync(cancellationToken);
            var trend = trendData
                .Select(x => new ReportTrendDto
                {
                    Date = x.Date.ToString("yyyy-MM-dd"),
                    Count = x.Count
                })
                .ToList();
            // ------------------------------------------
            // Status Distribution
            // ------------------------------------------
            var distribution = await filteredApplications
                .GroupBy(x => x.Status)
                .Select(x => new ApplicationStatusDistributionDto
                {
                    Status = x.Key,
                    Count = x.Count()
                })
                .OrderByDescending(x => x.Count)
                .ToListAsync(cancellationToken);
            // ------------------------------------------
            // Status Counts
            // ------------------------------------------
            var applied = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.Applied.ToString(),
                cancellationToken);
            var underReview = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.UnderReview.ToString(),
                cancellationToken);
            var shortlisted = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.Shortlisted.ToString(),
                cancellationToken);
            var interview = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.Interview.ToString(),
                cancellationToken);
            var hired = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.Hired.ToString(),
                cancellationToken);
            var rejected = await filteredApplications.CountAsync(
                x => x.Status ==
                     ApplicationStatus.Rejected.ToString(),
                cancellationToken);
            // ------------------------------------------
            // Result
            // ------------------------------------------
            return new ApplicationReportDto
            {
                TotalApplications =
                    await filteredApplications.CountAsync(
                        cancellationToken),
                Applied = applied,
                UnderReview = underReview,
                Shortlisted = shortlisted,
                Interview = interview,
                Hired = hired,
                Rejected = rejected,
                Trend = trend,
                Distribution = distribution,
                Funnel =
                [
                    new ApplicationFunnelDto
                    {
                        Stage = "Applied",
                        Count = applied
                    },
                    new ApplicationFunnelDto
                    {
                        Stage = "UnderReview",
                        Count = underReview
                    },
                    new ApplicationFunnelDto
                    {
                        Stage = "Shortlisted",
                        Count = shortlisted
                    },
                    new ApplicationFunnelDto
                    {
                        Stage = "Interview",
                        Count = interview
                    },
                    new ApplicationFunnelDto
                    {
                        Stage = "Hired",
                        Count = hired
                    }
                ]
            };
        }
        private async Task<InterviewReportDto>GetInterviewReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken)
        {
            var interviews =
                _context.Interviews
                    .AsNoTracking();
            var filtered =
                interviews.Where(x =>
                    (!from.HasValue || x.CreatedAt >= from) &&
                    (!to.HasValue || x.CreatedAt < to.Value.AddDays(1)));
            var trendData =
                await filtered
                    .GroupBy(x => x.CreatedAt.Date)
                    .Select(x => new
                    {
                        Date = x.Key,
                        Count = x.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync(cancellationToken);
            var trend =
                trendData
                    .Select(x => new ReportTrendDto
                    {
                        Date = x.Date.ToString("yyyy-MM-dd"),
                        Count = x.Count
                    })
                    .ToList();
            return new InterviewReportDto
            {
                TotalInterviews =
                    await interviews.CountAsync(cancellationToken),
                Scheduled =
                    await interviews.CountAsync(
                        x => x.Status == InterviewStatus.Scheduled,
                        cancellationToken),
                Rescheduled =
                    await interviews.CountAsync(
                        x => x.Status == InterviewStatus.Rescheduled,
                        cancellationToken),
                Completed =
                    await interviews.CountAsync(
                        x => x.Status == InterviewStatus.Completed,
                        cancellationToken),
                Cancelled =
                    await interviews.CountAsync(
                        x => x.Status == InterviewStatus.Cancelled,
                        cancellationToken),
                NoShow =
                    await interviews.CountAsync(
                        x => x.Status == InterviewStatus.NoShow,
                        cancellationToken),
                UpcomingInterviews =
                    await interviews.CountAsync(
                        x =>
                            x.ScheduledAt > DateTime.UtcNow &&
                            (
                                x.Status == InterviewStatus.Scheduled ||
                                x.Status == InterviewStatus.Rescheduled
                            ),
                        cancellationToken),
                Trend = trend
            };
        }
        private async Task<AtsReportDto>GetAtsReportAsync(
            CancellationToken cancellationToken)
        {
            var resumes =
                _context.Resumes
                    .AsNoTracking();
            var applications =
                _context.JobApplications
                    .AsNoTracking();
            var resumeCount =
                await resumes.CountAsync(cancellationToken);
            var applicationCount =
                await applications.CountAsync(cancellationToken);
            return new AtsReportDto
            {
                ResumesAnalyzed =
                    resumeCount,
                AverageResumeATS =
                    resumeCount == 0
                        ? 0
                        : await resumes.AverageAsync(
                            x => x.ATSScore,
                            cancellationToken),
                ApplicationsAnalyzed =
                    applicationCount,
                AverageApplicationATS =
                    applicationCount == 0
                        ? 0
                        : await applications.AverageAsync(
                            x => x.ATSScore,
                            cancellationToken),
                Above80 =
                    await resumes.CountAsync(
                        x => x.ATSScore >= 80,
                        cancellationToken),
                Between60And80 =
                    await resumes.CountAsync(
                        x =>
                            x.ATSScore >= 60 &&
                            x.ATSScore < 80,
                        cancellationToken),
                Below60 =
                    await resumes.CountAsync(
                        x => x.ATSScore < 60,
                        cancellationToken)
            };
        }
        private async Task<List<CompanyPerformanceDto>>GetCompanyPerformanceAsync(
            CancellationToken cancellationToken)
        {
            return await _context.Companies
                .AsNoTracking()
                .Select(company => new CompanyPerformanceDto
                {
                    CompanyId =
                        company.Id,
                    CompanyName =
                        company.CompanyName,
                    JobsPosted =
                        company.Jobs.Count(),
                    ActiveJobs =
                        company.Jobs.Count(
                            job => job.IsActive),
                    Applications =
                        company.Jobs
                            .SelectMany(job => job.Applications)
                            .Count(),
                    Shortlisted =
                        company.Jobs
                            .SelectMany(job => job.Applications)
                            .Count(application =>
                                application.Status ==
                                ApplicationStatus.Shortlisted.ToString()),
                    Interviews =
                        company.Jobs
                            .SelectMany(job => job.Applications)
                            .Count(application =>
                                application.Status ==
                                ApplicationStatus.Interview.ToString())
                })
                .OrderByDescending(x => x.Applications)
                .ToListAsync(cancellationToken);
        }
    }
}
