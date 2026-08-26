using Backend.DTOs.Job;

namespace Backend.Interfaces.Services;

public interface IJobService
{
    Task<JobResponseDto> CreateJobAsync(
        Guid companyId,
        CreateJobDto dto,
        CancellationToken cancellationToken);


    Task<IEnumerable<JobResponseDto>> GetAllJobsAsync(
        CancellationToken cancellationToken);



    Task<JobResponseDto?> GetJobByIdAsync(
        Guid id,
        CancellationToken cancellationToken);



    Task<bool> UpdateJobAsync(
        Guid companyId,
        Guid jobId,
        UpdateJobDto dto,
        CancellationToken cancellationToken);



    Task<bool> DeleteJobAsync(
        Guid companyId,
        Guid jobId,
        CancellationToken cancellationToken);
}
