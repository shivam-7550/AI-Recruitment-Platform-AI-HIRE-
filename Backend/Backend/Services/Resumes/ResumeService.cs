using Backend.DTOs.Resume;
using Backend.Interfaces;
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

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

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

        var newFileName =
            $"{Guid.NewGuid():N}{extension}";

        var newFilePath =
            Path.Combine(
                uploadFolder,
                newFileName);

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
            // =================================================
            // CLEANUP NEW FILE IF ANY ERROR OCCURS
            // =================================================

            DeletePhysicalFile(newFileName);

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

        var fileName =
            resume.FileName;

        // =================================================
        // DELETE DATABASE RECORD
        // =================================================

        await _resumeRepository.DeleteResumeAsync(
            resume,
            cancellationToken);

        await _resumeRepository.SaveChangesAsync(
            cancellationToken);

        // =================================================
        // DELETE PHYSICAL FILE
        // =================================================

        DeletePhysicalFile(fileName);

        return true;
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
                ".doc",
                ".docx",
                ".word"
            };

        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Only PDF, DOC, DOCX and WORD files are allowed.");
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

        var contentType =
            dto.Resume.ContentType?
                .ToLowerInvariant();

        var allowedContentTypes =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "application/pdf",

                "application/msword",

                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

                "application/octet-stream"
            };

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

        // =================================================
        // DOC
        // =================================================

        if (extension == ".doc")
        {
            /*
             * Old Microsoft Word .DOC files use the
             * legacy binary Word format.
             *
             * They cannot be parsed using ZipFile /
             * document.xml like DOCX.
             *
             * For now the file is allowed and stored.
             *
             * DOC parser support should be added through
             * a dedicated library/service.
             */
            return await ExtractLegacyWordTextAsync(
                filePath,
                cancellationToken);
        }

        // =================================================
        // WORD
        // =================================================

        if (extension == ".word")
        {
            /*
             * .word is not the normal Microsoft Word
             * extension. We still allow it according to
             * the application requirement.
             *
             * If the actual file is DOC/DOCX content,
             * a dedicated binary/document parser is needed
             * to extract the text safely.
             */
            return await ExtractLegacyWordTextAsync(
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
    // LEGACY WORD TEXT EXTRACTION
    // =====================================================

    private static async Task<string> ExtractLegacyWordTextAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        /*
         * .DOC is a binary Word format and cannot be read
         * using the DOCX XML approach.
         *
         * We keep this method separate so a dedicated
         * Word parser can be plugged in without changing
         * the complete upload flow.
         *
         * At this stage, returning empty text means the
         * upload will fail validation after saving.
         *
         * The next required change is to add a proper
         * .DOC parser.
         */

        await Task.CompletedTask;

        return string.Empty;
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

            ".doc" =>
                "The DOC file was received, but text extraction from legacy DOC format is not configured yet.",

            ".word" =>
                "The WORD file was received, but text extraction for this format is not configured yet.",

            _ =>
                "Unable to extract text from the resume."
        };
    }

    // =====================================================
    // DELETE PHYSICAL FILE
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

        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            /*
             * File deletion failure should not hide
             * the main upload/database operation result.
             */
        }
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