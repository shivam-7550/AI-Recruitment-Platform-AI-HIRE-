using Backend.DTOs.Job;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Jobs;

public class JobService : IJobService
{
    private readonly IJobRepository _jobRepository;
    private readonly INotificationService _notificationService;



    public JobService(
        IJobRepository jobRepository,
        INotificationService notificationService)
    {
        _jobRepository = jobRepository;
        _notificationService = notificationService;
    }





    // ==========================
    // CREATE JOB
    // ==========================

    public async Task<JobResponseDto> CreateJobAsync(
    Guid companyId,
    CreateJobDto dto,
    CancellationToken cancellationToken)
    {
        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            Salary = dto.Salary,
            Experience = dto.Experience,
            EmploymentType = dto.EmploymentType,
            Skills = dto.Skills,
            Vacancies = dto.Vacancies,
            LastDateToApply = dto.LastDateToApply,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _jobRepository.AddJobAsync(
            job,
            cancellationToken);

        await _jobRepository.SaveChangesAsync(
            cancellationToken);

        var createdJob = await _jobRepository.GetJobByIdAsync(
            job.Id,
            cancellationToken);

        if (createdJob is null)
        {
            throw new InvalidOperationException(
                "Job was created but could not be retrieved.");
        }

        await _notificationService.NotifyJobPostedAsync(
            createdJob.Id,
            createdJob.Title,
            createdJob.Company.CompanyName, cancellationToken);

        return new JobResponseDto
        {
            Id = createdJob.Id,
            CompanyId = createdJob.CompanyId,
            CompanyName = createdJob.Company.CompanyName,

            Title = createdJob.Title,
            Description = createdJob.Description,
            Location = createdJob.Location,

            Salary = createdJob.Salary,
            Experience = createdJob.Experience,

            EmploymentType = createdJob.EmploymentType,
            Skills = createdJob.Skills,
            Vacancies = createdJob.Vacancies,

            LastDateToApply = createdJob.LastDateToApply,
            IsActive = createdJob.IsActive,
            CreatedAt = createdJob.CreatedAt
        };
    }






    // ==========================
    // GET ALL JOBS
    // ==========================

    public async Task<IEnumerable<JobResponseDto>> GetAllJobsAsync(
        CancellationToken cancellationToken)
    {

        var jobs =
            await _jobRepository.GetAllJobsAsync(
                cancellationToken);



        return jobs.Select(job => new JobResponseDto
        {
            Id = job.Id,

            CompanyId = job.CompanyId,

            Title = job.Title,

            CompanyName = job.Company.CompanyName,

            Description = job.Description,

            Location = job.Location,

            Salary = job.Salary,

            Experience = job.Experience,

            EmploymentType = job.EmploymentType,

            Skills = job.Skills,

            Vacancies = job.Vacancies,

            LastDateToApply = job.LastDateToApply,

            IsActive = job.IsActive,

            CreatedAt = job.CreatedAt

        });
    }







    // ==========================
    // GET JOB BY ID
    // ==========================

    public async Task<JobResponseDto?> GetJobByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {

        var job =
            await _jobRepository.GetJobByIdAsync(
                id,
                cancellationToken);



        if (job == null)
            return null;



        return new JobResponseDto
        {
            Id = job.Id,

            CompanyId = job.CompanyId,

            Title = job.Title,

            CompanyName = job.Company.CompanyName,

            Description = job.Description,

            Location = job.Location,

            Salary = job.Salary,

            Experience = job.Experience,

            EmploymentType = job.EmploymentType,

            Skills = job.Skills,

            Vacancies = job.Vacancies,

            LastDateToApply = job.LastDateToApply,

            IsActive = job.IsActive,

            CreatedAt = job.CreatedAt
        };
    }







    // ==========================
    // UPDATE JOB
    // ==========================

    public async Task<bool> UpdateJobAsync(
        Guid companyId,
        Guid jobId,
        UpdateJobDto dto,
        CancellationToken cancellationToken)
    {

        var job =
            await _jobRepository.GetCompanyJobAsync(
                companyId,
                jobId,
                cancellationToken);



        if (job == null)
            return false;



        job.Title = dto.Title;

        job.Description = dto.Description;

        job.Location = dto.Location;

        job.Salary = dto.Salary;

        job.Experience = dto.Experience;

        job.EmploymentType = dto.EmploymentType;

        job.Skills = dto.Skills;

        job.Vacancies = dto.Vacancies;

        job.LastDateToApply = dto.LastDateToApply;

        job.IsActive = dto.IsActive;



        await _jobRepository.UpdateJobAsync(
            job,
            cancellationToken);



        await _jobRepository.SaveChangesAsync(
            cancellationToken);



        return true;
    }







    // ==========================
    // DELETE JOB
    // ==========================

    public async Task<bool> DeleteJobAsync(
        Guid companyId,
        Guid jobId,
        CancellationToken cancellationToken)
    {

        var job =
            await _jobRepository.GetCompanyJobAsync(
                companyId,
                jobId,
                cancellationToken);



        if (job == null)
            return false;



        await _jobRepository.DeleteJobAsync(
            job,
            cancellationToken);



        await _jobRepository.SaveChangesAsync(
            cancellationToken);



        return true;
    }
}
