using Backend.DTOs.Resume;

using Backend.Interfaces.ATS;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Interfaces.Utilities;
using Backend.Models;
using System.IO.Compression;
using System.Xml;
using System.Xml.Linq;

namespace Backend.Services.Resumes;

public sealed class ResumeService : IResumeService
{
    private readonly IResumeRepository _resumeRepository;
    private readonly IWebHostEnvironment _environment;
    private readonly IPdfParser _pdfParser;
    private readonly ISkillExtractor _skillExtractor;
    private readonly IATSService _atsService;
    private readonly IResumeAIService _resumeAIService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public ResumeService(
        IResumeRepository resumeRepository,
        IWebHostEnvironment environment,
        IPdfParser pdfParser,
        ISkillExtractor skillExtractor,
        IATSService atsService,
        IResumeAIService resumeAIService)
    {
        _resumeRepository = resumeRepository;
        _environment = environment;
        _pdfParser = pdfParser;
        _skillExtractor = skillExtractor;
        _atsService = atsService;
        _resumeAIService = resumeAIService;
    }

    // =====================================================
    // UPLOAD RESUME
    // =====================================================

    public async Task<ResumeResponseDto> UploadResumeAsync(
        Guid userId,
        UploadResumeDto dto,
        CancellationToken cancellationToken)
    {
        // =================================================
        // VALIDATE FILE
        // =================================================

        ValidateResumeFile(dto);

        // =================================================
        // GET EXISTING RESUME
        // =================================================

        var existingResume =
            await _resumeRepository.GetResumeByUserIdAsync(
                userId,
                cancellationToken);

        // =================================================
        // UPLOAD FOLDER
        // =================================================

        var uploadFolder =
            Path.Combine(
                _environment.WebRootPath ?? "wwwroot",
                "resumes");

        Directory.CreateDirectory(uploadFolder);

        // =================================================
        // FILE EXTENSION
        // =================================================

        var extension =
            Path.GetExtension(dto.Resume.FileName)
                .ToLowerInvariant();

        // =================================================
        // SERVER FILE NAME
        // =================================================

        var physicalFileName =
    $"{Guid.NewGuid():N}{extension}";

        var newFilePath =
              Path.Combine(
            uploadFolder,
            physicalFileName);

        // =================================================
        // SAVE PHYSICAL FILE
        // =================================================

        try
        {
            await using (
                var stream = new FileStream(
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

            // =================================================
            // VERIFY FILE WAS SAVED
            // =================================================

            if (!File.Exists(newFilePath))
            {
                throw new InvalidOperationException(
                    "Resume file could not be saved.");
            }

            // =================================================
            // EXTRACT RESUME TEXT
            // =================================================

            var resumeText =
                await ExtractResumeTextAsync(
                    newFilePath,
                    extension,
                    cancellationToken);

            var parsedData =
                await _resumeAIService
                    .ExtractResumeDataAsync(
                    resumeText,
                    cancellationToken);

            if (string.IsNullOrWhiteSpace(resumeText))
            {
                throw new ArgumentException(
                    GetExtractionErrorMessage(extension));
            }

            // =================================================
            // EXTRACT SKILLS
            // =================================================

            var skills =
                _skillExtractor.ExtractSkills(resumeText);

            var extractedSkills =
                string.Join(",", skills);

            // =================================================
            // UPDATE EXISTING RESUME
            // =================================================

            if (existingResume != null)
            {
                var oldFilePath =
                existingResume.FilePath;

                existingResume.FileName =
                    dto.Resume.FileName;

                existingResume.FilePath =
                    $"resumes/{physicalFileName}";

                existingResume.ResumeText =
                    resumeText;

                existingResume.ExtractedSkills =
                    extractedSkills;

                existingResume.ProfessionalSummary =
                    parsedData.ProfessionalSummary;

                existingResume.EducationDetails =
                    string.Join(
                        ", ",
                        parsedData.Education);

                existingResume.Projects =
                    string.Join(
                        ", ",
                        parsedData.Projects);

                existingResume.Certifications =
                    string.Join(
                        ", ",
                        parsedData.Certifications);

                existingResume.ExperienceYears =
                    parsedData.ExperienceYears;

                existingResume.UploadedAt =
                    DateTime.UtcNow;

                // =================================================
                // GENERAL ATS SCORE
                // =================================================

                existingResume.ATSScore =
                    _atsService.CalculateResumeScore(
                        existingResume);

                await _resumeRepository.UpdateResumeAsync(
                    existingResume,
                    cancellationToken);

                await _resumeRepository.SaveChangesAsync(
                    cancellationToken);

                // =================================================
                // DELETE OLD FILE
                // =================================================

                if (!string.IsNullOrWhiteSpace(
                        oldFilePath))
                {
                    DeletePhysicalFileByRelativePath(
                        oldFilePath);
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
                   dto.Resume.FileName,

                FilePath =
                    $"resumes/{physicalFileName}",

                ResumeText =
                    resumeText,

                ExtractedSkills =
                    extractedSkills,

                ProfessionalSummary =
                    parsedData.ProfessionalSummary,

                EducationDetails =
                    string.Join(
                        ", ",
                    parsedData.Education),

                Projects =
                    string.Join(
                        ", ",
                    parsedData.Projects),

                Certifications =
                    string.Join(
                        ", ",
                    parsedData.Certifications),

                ExperienceYears =
                    parsedData.ExperienceYears,

                UploadedAt =
                    DateTime.UtcNow,

                ATSScore = 0
            };
            // =================================================
            // GENERAL ATS SCORE
            // =================================================

            resume.ATSScore =
                _atsService.CalculateResumeScore(
                    resume);

            // =================================================
            // SAVE DATABASE
            // =================================================

            await _resumeRepository.AddResumeAsync(
                resume,
                cancellationToken);

            await _resumeRepository.SaveChangesAsync(
                cancellationToken);

            return MapToResponse(resume);
        }
        catch
        {
            DeletePhysicalFileByRelativePath(
                $"resumes/{physicalFileName}");

            throw;
        }
    }

    // =====================================================
    // GET RESUME
    // =====================================================

    public async Task<ResumeResponseDto?> GetResumeAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository.GetResumeByUserIdAsync(
                userId,
                cancellationToken);

        if (resume == null)
        {
            return null;
        }

        return MapToResponse(resume);
    }

    // =====================================================
    // ANALYZE RESUME
    // =====================================================

    public async Task<ResumeATSScoreDto> AnalyzeResumeAsync(
        Guid userId,
        Guid resumeId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository.GetResumeByUserIdAsync(
                userId,
                cancellationToken);

        if (resume == null || resume.Id != resumeId)
        {
            throw new KeyNotFoundException(
                "Resume not found.");
        }

        if (string.IsNullOrWhiteSpace(resume.ResumeText))
        {
            throw new InvalidOperationException(
                "Resume text is empty. Please upload a valid resume.");
        }

        // =================================================
        // GENERAL ATS SCORE
        // =================================================

        var score =
            _atsService.CalculateResumeScore(resume);

        resume.ATSScore =
            score;

        await _resumeRepository.UpdateResumeAsync(
            resume,
            cancellationToken);

        await _resumeRepository.SaveChangesAsync(
            cancellationToken);

        // =================================================
        // MATCHED / EXTRACTED SKILLS
        // =================================================

        var matchedSkills =
            SplitSkills(resume.ExtractedSkills);

        return new ResumeATSScoreDto
        {
            ATSScore =
                score,

            MatchedSkills =
                matchedSkills,

            MissingSkills =
                new List<string>(),

            Strengths =
                new List<string>(),

            Suggestions =
                new List<string>()
        };
    }

    // =====================================================
    // SPLIT SKILLS
    // =====================================================

    private static List<string> SplitSkills(
        string? skills)
    {
        if (string.IsNullOrWhiteSpace(skills))
        {
            return new List<string>();
        }

        return skills
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(
                StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    // =====================================================
    // DELETE RESUME
    // =====================================================

    public async Task<bool> DeleteResumeAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var resume =
            await _resumeRepository.GetResumeByUserIdAsync(
                userId,
                cancellationToken);

        if (resume == null)
        {
            return false;
        }

        var filePath =
            resume.FilePath;

        await _resumeRepository.DeleteResumeAsync(
            resume,
            cancellationToken);

        await _resumeRepository.SaveChangesAsync(
            cancellationToken);

        DeletePhysicalFileByRelativePath(
            filePath);

        return true;
    }

    private void DeletePhysicalFileByRelativePath(
    string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return;
        }

        var webRoot =
            _environment.WebRootPath ?? "wwwroot";

        var normalizedPath =
            relativePath
                .TrimStart('/', '\\')
                .Replace('/', Path.DirectorySeparatorChar)
                .Replace('\\', Path.DirectorySeparatorChar);

        var fullPath =
            Path.Combine(
                webRoot,
                normalizedPath);

        try
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch
        {
        }
    }

    // =====================================================
    // VALIDATE RESUME FILE
    // =====================================================

    private static void ValidateResumeFile(
        UploadResumeDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentException(
                "Resume upload data is required.");
        }

        if (dto.Resume == null)
        {
            throw new ArgumentException(
                "Resume file is required.");
        }

        if (dto.Resume.Length <= 0)
        {
            throw new ArgumentException(
                "Resume file is empty.");
        }

        // =================================================
        // NORMALIZE FILE EXTENSION
        // =================================================

        var extension =
            Path.GetExtension(dto.Resume.FileName)
                .ToLowerInvariant();

        // =================================================
        // ALLOWED FILE TYPES
        // =================================================

        var allowedExtensions =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                ".pdf",
                
                ".docx",
               
            };

        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Only PDF and DOCX files are allowed.");
        }

        // =================================================
        // MAX SIZE = 5 MB
        // =================================================

        const long maxFileSize =
            5L * 1024L * 1024L;

        if (dto.Resume.Length > maxFileSize)
        {
            throw new ArgumentException(
                "Maximum resume size is 5 MB.");
        }

        // =================================================
        // BASIC CONTENT TYPE VALIDATION
        // =================================================

        //var contentType =
        //    dto.Resume.ContentType?
        //        .ToLowerInvariant();

        //var allowedContentTypes =
        //    new HashSet<string>(
        //        StringComparer.OrdinalIgnoreCase)
        //    {
        //        "application/pdf",

        //        "application/msword",

        //        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        //        "application/octet-stream"
        //    };

        /*
         * Some browsers send DOC/DOCX as
         * application/octet-stream.
         *
         * Therefore we don't reject the file
         * solely because Content-Type is different.
         *
         * Extension remains the primary validation.
         */
    }

    // =====================================================
    // EXTRACT RESUME TEXT
    // =====================================================

    private async Task<string> ExtractResumeTextAsync(
        string filePath,
        string extension,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        // =================================================
        // PDF
        // =================================================

        if (extension == ".pdf")
        {
            return _pdfParser.ExtractText(filePath);
        }

        // =================================================
        // DOCX
        // =================================================

        if (extension == ".docx")
        {
            return await ExtractDocxTextAsync(
                filePath,
                cancellationToken);
        }

        return string.Empty;
    }

    // =====================================================
    // DOCX TEXT EXTRACTION
    // =====================================================

    private static async Task<string> ExtractDocxTextAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            using var archive =
                ZipFile.OpenRead(filePath);

            var documentEntry =
                archive.GetEntry(
                    "word/document.xml");

            if (documentEntry == null)
            {
                return string.Empty;
            }

            await using var stream =
                documentEntry.Open();

            var document =
                await XDocument.LoadAsync(
                    stream,
                    LoadOptions.None,
                    cancellationToken);

            XNamespace word =
                "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

            var paragraphs =
                document
                    .Descendants(word + "p")
                    .Select(paragraph =>
                        string.Concat(
                            paragraph
                                .Descendants(word + "t")
                                .Select(text => text.Value)))
                    .Where(text =>
                        !string.IsNullOrWhiteSpace(text));

            return string.Join(
                Environment.NewLine,
                paragraphs);
        }
        catch (InvalidDataException)
        {
            return string.Empty;
        }
        catch (XmlException)
        {
            return string.Empty;
        }
    }

   

    // =====================================================
    // EXTRACTION ERROR MESSAGE
    // =====================================================

    private static string GetExtractionErrorMessage(
    string extension)
    {
        return extension switch
        {
            ".pdf" =>
                "Unable to extract text from the PDF. Please upload a readable PDF.",

            ".docx" =>
                "Unable to extract text from the DOCX file. Please upload a valid Word document.",

            _ =>
                "Unable to extract text from the resume."
        };
    }

   
    // =====================================================
    // MAP RESPONSE
    // =====================================================

    private static ResumeResponseDto MapToResponse(
        Resume resume)
    {
        return new ResumeResponseDto
        {
            Id =
                resume.Id,

            UserId =
                resume.UserId,

            FileName =
                resume.FileName,

            FilePath =
                resume.FilePath,

            UploadedAt =
                resume.UploadedAt,

            ATSScore =
                resume.ATSScore
        };
    }
}