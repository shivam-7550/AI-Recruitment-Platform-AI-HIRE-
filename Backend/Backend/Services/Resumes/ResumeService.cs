using Backend.DTOs.Resume;
using Backend.Interfaces.ATS;
using Backend.Models;
using Backend.Interfaces;
using Backend.Interfaces.Services;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Utilities;
namespace Backend.Services.Resumes;

public sealed class ResumeService : IResumeService
{
    private readonly IResumeRepository _resumeRepository;
    private readonly IWebHostEnvironment _environment;
    private readonly IPdfParser _pdfParser;
    private readonly ISkillExtractor _skillExtractor;
    private readonly IATSService _atsService;

    public ResumeService(
        IResumeRepository resumeRepository,
        IWebHostEnvironment environment,
        IPdfParser pdfParser,
        ISkillExtractor skillExtractor,
        IATSService atsService)
    {
        _resumeRepository = resumeRepository;
        _environment = environment;
        _pdfParser = pdfParser;
        _skillExtractor = skillExtractor;
        _atsService = atsService;
    }

    // =====================================================
    // Upload Resume
    // =====================================================

    public async Task<ResumeResponseDto> UploadResumeAsync(
        Guid userId,
        UploadResumeDto dto,
        CancellationToken cancellationToken)
    {
        ValidateResumeFile(dto);

        // IMPORTANT:
        // Get the existing Resume entity.
        // Repository should return a TRACKED entity for update.
        var existingResume =
            await _resumeRepository
                .GetResumeByUserIdAsync(
                    userId,
                    cancellationToken);

        var uploadFolder =
            Path.Combine(
                _environment.WebRootPath ?? "wwwroot",
                "resumes");

        Directory.CreateDirectory(uploadFolder);

        var extension =
            Path.GetExtension(dto.Resume.FileName)
                .ToLowerInvariant();

        var newFileName =
            $"{Guid.NewGuid():N}{extension}";

        var newFilePath =
            Path.Combine(
                uploadFolder,
                newFileName);

        // =================================================
        // Save New Physical File
        // =================================================

        await using (var stream =
            new FileStream(
                newFilePath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true))
        {
            await dto.Resume.CopyToAsync(
                stream,
                cancellationToken);
        }

        try
        {
            // =================================================
            // Extract Resume Text
            // =================================================

            var resumeText =
                await ExtractResumeText(
                    newFilePath,
                    extension,
                    cancellationToken);

            // =================================================
            // Extract Skills
            // =================================================

            var skills =
                _skillExtractor
                    .ExtractSkills(resumeText);

            var extractedSkills =
                string.Join(",", skills);

            // =================================================
            // UPDATE EXISTING RESUME
            // =================================================

            if (existingResume != null)
            {
                // Keep the SAME Resume.Id.
                //
                // This is very important because
                // JobApplications.ResumeId may reference
                // this Resume record.

                var oldFileName =
                    existingResume.FileName;

                existingResume.FileName =
                    newFileName;

                existingResume.FilePath =
                    $"resumes/{newFileName}";

                existingResume.ResumeText =
                    resumeText;

                existingResume.ExtractedSkills =
                    extractedSkills;

                existingResume.UploadedAt =
                    DateTime.UtcNow;

                existingResume.ATSScore =
                    _atsService.CalculateResumeScore(
                        existingResume);

                // Entity is already tracked by repository.
                // No need to create a new Resume object.
                await _resumeRepository
                    .UpdateResumeAsync(
                        existingResume,
                        cancellationToken);

                await _resumeRepository
                    .SaveChangesAsync(
                        cancellationToken);

                // Delete old physical file ONLY after
                // database update succeeds.
                if (!string.Equals(
                        oldFileName,
                        newFileName,
                        StringComparison.OrdinalIgnoreCase))
                {
                    DeletePhysicalFile(oldFileName);
                }

                return MapToResponse(existingResume);
            }

            // =================================================
            // CREATE NEW RESUME
            // =================================================

            var resume = new Resume
            {
                Id = Guid.NewGuid(),

                UserId = userId,

                FileName =
                    newFileName,

                FilePath =
                    $"resumes/{newFileName}",

                ResumeText =
                    resumeText,

                ExtractedSkills =
                    extractedSkills,

                UploadedAt =
                    DateTime.UtcNow,

                ATSScore =
                    0
            };

            // Calculate general ATS score
            resume.ATSScore =
                _atsService.CalculateResumeScore(
                    resume);

            await _resumeRepository
                .AddResumeAsync(
                    resume,
                    cancellationToken);

            await _resumeRepository
                .SaveChangesAsync(
                    cancellationToken);

            return MapToResponse(resume);
        }
        catch
        {
            // If database/extraction fails after the new
            // physical file has been created, clean it up.
            DeletePhysicalFile(newFileName);

            throw;
        }
    }

    // =====================================================
    // Get Resume
    // =====================================================

    public async Task<ResumeResponseDto?> GetResumeAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository
                .GetResumeByUserIdAsync(
                    userId,
                    cancellationToken);

        if (resume == null)
        {
            return null;
        }

        return MapToResponse(resume);
    }

    // =====================================================
    // Analyze Resume
    // =====================================================

    public async Task<ResumeATSScoreDto> AnalyzeResumeAsync(
        Guid userId,
        Guid resumeId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository
                .GetResumeByUserIdAsync(
                    userId,
                    cancellationToken);

        if (resume == null || resume.Id != resumeId)
        {
            throw new KeyNotFoundException(
                "Resume not found.");
        }

        var matchedSkills =
            (resume.ExtractedSkills ?? string.Empty)
                .Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries)
                .ToList();

        var strengths = new List<string>();

        var suggestions = new List<string>();

        if (matchedSkills.Count > 0)
        {
            strengths.Add("Relevant skills were detected in your resume.");
        }
        else
        {
            suggestions.Add("Add a clear skills section with relevant technologies.");
        }

        if (!string.IsNullOrWhiteSpace(resume.Email) ||
            !string.IsNullOrWhiteSpace(resume.PhoneNumber))
        {
            strengths.Add("Contact information is available.");
        }
        else
        {
            suggestions.Add("Add your email address and phone number.");
        }

        if (resume.ATSScore < 60)
        {
            suggestions.Add("Add measurable experience, education and project details.");
        }

        return new ResumeATSScoreDto
        {
            ATSScore = resume.ATSScore,
            MatchedSkills = matchedSkills,
            Strengths = strengths,
            Suggestions = suggestions
        };
    }

    // =====================================================
    // Delete Resume
    // =====================================================

    public async Task<bool> DeleteResumeAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository
                .GetResumeByUserIdAsync(
                    userId,
                    cancellationToken);

        if (resume == null)
        {
            return false;
        }

        // Keep the file name before deleting the entity.
        var fileName =
            resume.FileName;

        await _resumeRepository
            .DeleteResumeAsync(
                resume,
                cancellationToken);

        await _resumeRepository
            .SaveChangesAsync(
                cancellationToken);

        // Delete physical file only after
        // database deletion succeeds.
        DeletePhysicalFile(fileName);

        return true;
    }

    // =====================================================
    // Validate Resume
    // =====================================================

    private static void ValidateResumeFile(
        UploadResumeDto dto)
    {
        if (dto.Resume == null)
        {
            throw new ArgumentException(
                "Resume file is required.");
        }

        if (dto.Resume.Length == 0)
        {
            throw new ArgumentException(
                "Resume file is empty.");
        }

        var extension =
            Path.GetExtension(
                dto.Resume.FileName)
            .ToLowerInvariant();

        var allowedExtensions =
            new[]
            {
                ".pdf",
                ".docx"
            };

        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Only PDF and DOCX files are allowed.");
        }

        const long maxFileSize =
            5 * 1024 * 1024;

        if (dto.Resume.Length > maxFileSize)
        {
            throw new ArgumentException(
                "Maximum file size is 5 MB.");
        }
    }

    // =====================================================
    // Extract Resume Text
    // =====================================================

    private async Task<string> ExtractResumeText(
        string filePath,
        string extension,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (extension == ".pdf")
        {
            return _pdfParser
                .ExtractText(filePath);
        }

        if (extension == ".docx")
        {
            // DOCX parser can be implemented later.
            return string.Empty;
        }

        return string.Empty;
    }

    // =====================================================
    // Delete Physical File
    // =====================================================

    private void DeletePhysicalFile(
        string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return;
        }

        var path =
            Path.Combine(
                _environment.WebRootPath ?? "wwwroot",
                "resumes",
                fileName);

        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    // =====================================================
    // Map Response
    // =====================================================

    private static ResumeResponseDto MapToResponse(
        Resume resume)
    {
        return new ResumeResponseDto
        {
            Id = resume.Id,

            UserId = resume.UserId,

            FileName = resume.FileName,

            FilePath = resume.FilePath,

            UploadedAt = resume.UploadedAt,

            ATSScore = resume.ATSScore
        };
    }
}
