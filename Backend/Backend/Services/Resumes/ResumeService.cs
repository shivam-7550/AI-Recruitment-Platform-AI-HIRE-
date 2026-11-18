using Backend.DTOs.Resume;
using Backend.Interfaces.ATS;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Interfaces.Utilities;
using Backend.Models;
using System.IO.Compression;
using System.Text.RegularExpressions;
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
            // Uploading a resume must not depend on Gemini being configured
            // or available. Keep the upload and ATS data usable independently;
            // AI analysis runs on demand from the candidate portal.
            var parsedData = new ResumeParsedDataDto
            {
                Skills = skills,
                Education = new List<string>(),
                Projects = new List<string>(),
                Certifications = new List<string>(),
                ProfessionalSummary = string.Empty,
                ExperienceYears = 0
            };
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
    public async Task<ResumeAIAnalysisDto> AnalyzeResumeAsync(
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
        ResumeAIAnalysisDto analysis;
        try
        {
            analysis = await _resumeAIService.AnalyzeResumeAsync(
                resume.ResumeText,
                resume.ExtractedSkills ?? string.Empty,
                cancellationToken);
        }
        catch (InvalidOperationException)
        {
            // Gemini free-tier limits and temporary provider failures should
            // not prevent candidates from receiving useful resume feedback.
            analysis = BuildLocalResumeAnalysis(resume);
        }
        analysis.ATSScore = _atsService.CalculateResumeScore(resume);
        analysis.MatchedSkills = SplitSkills(resume.ExtractedSkills);
        analysis.MissingSkills ??= new List<string>();
        analysis.Strengths ??= new List<string>();
        analysis.Suggestions ??= new List<string>();
        resume.ATSScore = analysis.ATSScore;
        await _resumeRepository.UpdateResumeAsync(
            resume,
            cancellationToken);
        await _resumeRepository.SaveChangesAsync(
            cancellationToken);
        return analysis;
    }

    private static ResumeAIAnalysisDto BuildLocalResumeAnalysis(Resume resume)
    {
        var text = resume.ResumeText;
        var skills = SplitSkills(resume.ExtractedSkills);
        var years = EstimateExperienceYears(text, resume.ExperienceYears);
        var role = InferResumeRole(text);
        var expectedSkills = role switch
        {
            "Frontend development" => new[]
            {
                "JavaScript", "TypeScript", "HTML", "CSS", "React", "Angular",
                "Vue", "responsive design", "accessibility", "frontend testing"
            },
            "Backend development" => new[]
            {
                "REST API", "SQL", "authentication and authorization", "unit testing",
                "Docker", "caching", "CI/CD"
            },
            "Data and machine learning" => new[]
            {
                "Python", "SQL", "statistics", "data visualization", "pandas",
                "numpy", "model evaluation"
            },
            "Cloud and DevOps" => new[]
            {
                "Linux", "cloud platform", "Docker", "Kubernetes", "CI/CD",
                "infrastructure as code", "monitoring"
            },
            "Quality assurance" => new[]
            {
                "test automation", "Selenium", "API testing", "test planning",
                "bug tracking", "CI/CD"
            },
            _ => Array.Empty<string>()
        };
        var missingSkills = expectedSkills
            .Where(skill => !text.Contains(skill, StringComparison.OrdinalIgnoreCase))
            .Take(6)
            .ToList();

        var strengths = new List<string>();
        if (skills.Count > 0)
            strengths.Add($"The resume clearly mentions {skills.Count} identifiable technical skills.");
        if (years > 0)
            strengths.Add($"Work history indicates approximately {years} year(s) of experience.");
        if (Regex.IsMatch(text, @"\b(project|portfolio)\b", RegexOptions.IgnoreCase))
            strengths.Add("Projects or portfolio work is included, giving evidence of applied experience.");
        if (Regex.IsMatch(text, @"\b\d+\s*(%|percent|users|customers|clients|projects)\b", RegexOptions.IgnoreCase))
            strengths.Add("The resume includes measurable results that help show impact.");
        if (strengths.Count == 0)
            strengths.Add("The resume text is readable and can be evaluated; add clearer sections and role-specific details to make strengths easier to find.");

        var suggestions = new List<string>();
        if (!Regex.IsMatch(text, @"\b(summary|profile|objective)\b", RegexOptions.IgnoreCase))
            suggestions.Add("Add a short professional summary naming your target role, strongest skills, and experience level.");
        if (!Regex.IsMatch(text, @"\b\d+\s*(%|percent|users|customers|clients|projects)\b", RegexOptions.IgnoreCase))
            suggestions.Add("For each experience entry, add 2–4 bullets describing what you did, which tools you used, and a measurable result where you can support one.");
        if (!Regex.IsMatch(text, @"\b(project|portfolio)\b", RegexOptions.IgnoreCase))
            suggestions.Add("Add one or two relevant projects with your contribution, technology choices, and outcome.");
        if (years == 0)
            suggestions.Add("Make role dates and total experience clear. Include month/year dates so recruiters and ATS systems can follow your timeline.");
        else
            suggestions.Add("Show progression across your experience: ownership, scope, tools used, and outcomes for each role.");
        suggestions.Add("Use a simple section structure and include keywords from each role you apply for only when they match your real experience.");

        return new ResumeAIAnalysisDto
        {
            AnalysisMode = "Local",
            Summary = $"Local resume review for a profile that appears focused on {role.ToLowerInvariant()}. This review uses extracted resume text because AI analysis is temporarily unavailable.",
            Strengths = strengths,
            MatchedSkills = skills,
            MissingSkills = missingSkills,
            Suggestions = suggestions,
            ExperienceMatch = years > 0 ? 70 : 25
        };
    }

    private static string InferResumeRole(string text)
    {
        var profiles = new (string Name, string[] Terms)[]
        {
            ("Frontend development", new[] { "frontend", "front-end", "react", "angular", "vue", "ui developer" }),
            ("Backend development", new[] { "backend", "back-end", "asp.net", "web api", "rest api", "microservices" }),
            ("Data and machine learning", new[] { "data analyst", "data scientist", "machine learning", "pytorch", "tensorflow" }),
            ("Cloud and DevOps", new[] { "devops", "cloud engineer", "kubernetes", "docker", "infrastructure" }),
            ("Quality assurance", new[] { "quality assurance", "qa engineer", "software tester", "selenium", "test automation" })
        };
        return profiles
            .Select(profile => new
            {
                profile.Name,
                Matches = profile.Terms.Count(term => text.Contains(term, StringComparison.OrdinalIgnoreCase))
            })
            .Where(profile => profile.Matches > 0)
            .OrderByDescending(profile => profile.Matches)
            .Select(profile => profile.Name)
            .FirstOrDefault() ?? "general professional";
    }

    private static int EstimateExperienceYears(string text, int storedYears)
    {
        if (storedYears > 0)
            return storedYears;
        var explicitYears = Regex.Matches(
            text,
            @"\b(\d{1,2})\+?\s+years?\b",
            RegexOptions.IgnoreCase);
        if (explicitYears.Count > 0 &&
            int.TryParse(explicitYears[0].Groups[1].Value, out var years))
            return years;

        var dates = Regex.Matches(text, @"\b(?:19|20)\d{2}\b")
            .Cast<Match>()
            .Select(match => int.Parse(match.Value))
            .Where(year => year <= DateTime.UtcNow.Year)
            .Distinct()
            .OrderBy(year => year)
            .ToArray();
        return dates.Length >= 2 ? Math.Min(50, dates[^1] - dates[0]) : 0;
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
