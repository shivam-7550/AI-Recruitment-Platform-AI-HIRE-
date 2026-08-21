using Backend.DTOs.Resume;

namespace Backend.Interfaces;

public interface IResumeService
{
    Task<ResumeResponseDto> UploadResumeAsync(
        Guid userId,
        UploadResumeDto dto,
        CancellationToken cancellationToken);

    Task<ResumeResponseDto?> GetResumeAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<bool> DeleteResumeAsync(
        Guid userId,
        CancellationToken cancellationToken);
}