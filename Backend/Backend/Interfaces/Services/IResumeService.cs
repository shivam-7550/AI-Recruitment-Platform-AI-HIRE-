using Backend.DTOs.Resume;

namespace Backend.Interfaces.Services;

public interface IResumeService
{
    // =====================================================
    // UPLOAD RESUME
    // =====================================================

    Task<ResumeResponseDto> UploadResumeAsync(
        Guid userId,
        UploadResumeDto dto,
        CancellationToken cancellationToken);


    // =====================================================
    // GET CURRENT USER RESUME
    // =====================================================

    Task<ResumeResponseDto?> GetResumeAsync(
        Guid userId,
        CancellationToken cancellationToken);


    // =====================================================
    // GENERAL ATS ANALYSIS
    // =====================================================

    Task<ResumeATSScoreDto> AnalyzeResumeAsync(
        Guid userId,
        Guid resumeId,
        CancellationToken cancellationToken);


    // =====================================================
    // DELETE RESUME
    // =====================================================

    Task<bool> DeleteResumeAsync(
        Guid userId,
        CancellationToken cancellationToken);
}