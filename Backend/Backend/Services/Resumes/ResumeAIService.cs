using System.Net.Http.Json;
using System.Text.Json;
using Backend.DTOs.Resume;
using Backend.Interfaces.Services;

namespace Backend.Services.Resumes;

public sealed class ResumeAIService : IResumeAIService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    // =========================================================
    // GEMINI INTERACTIONS API
    // =========================================================

    private const string GeminiUrl = "https://generativelanguage.googleapis.com/v1beta/interactions";

    private const string ApiRevision = "2026-05-20";


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ResumeAIService(
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<ResumeParsedDataDto> ExtractResumeDataAsync(
        string resumeText,
        CancellationToken cancellationToken)
    {
        ValidateResumeText(resumeText);

        var apiKey =
            GetApiKey();

        var prompt = $"""
    You are an expert resume parsing engine.

    Extract ONLY the information that is explicitly
    present in the resume.

    ================= RESUME =================

    {resumeText}

    ================= TASK =================

    Extract:

    1. Skills
    2. Total Experience Years
    3. Education
    4. Projects
    5. Certifications
    6. Professional Summary

    ================= RULES =================

    - Do not invent information.
    - Do not assume missing experience.
    - Do not assume certifications.
    - Do not create projects.
    - Use only information present in the resume.
    - ExperienceYears must be an integer.
    - If something is missing return an empty list.
    - ProfessionalSummary should be concise.

    Return ONLY valid JSON matching the schema.
    """;

        var body = new
        {
            model = GetModel(),

            input = prompt,

            store = false,

            response_format =
                BuildJsonResponseFormat(
                    BuildResumeExtractionSchema())
        };

        var data =
            await SendGeminiRequestAsync<
                ResumeParsedDataDto>(
                    apiKey,
                    body,
                    cancellationToken);

        NormalizeResumeData(data);

        return data;
    }

    private static void NormalizeResumeData(
    ResumeParsedDataDto data)
    {
        if (data == null)
        {
            return;
        }

        data.Skills ??=
            new List<string>();

        data.Education ??=
            new List<string>();

        data.Projects ??=
            new List<string>();

        data.Certifications ??=
            new List<string>();

        data.ProfessionalSummary ??=
            string.Empty;

        if (data.ExperienceYears < 0)
        {
            data.ExperienceYears = 0;
        }
    }
    private static object BuildResumeExtractionSchema()
    {
        return new
        {
            type = "object",

            properties = new
            {
                skills = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                experienceYears = new
                {
                    type = "integer"
                },

                education = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                projects = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                certifications = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                professionalSummary = new
                {
                    type = "string"
                }
            },

            required = new[]
            {
            "skills",
            "experienceYears",
            "education",
            "projects",
            "certifications",
            "professionalSummary"
        }
        };
    }

    // =========================================================
    // GENERAL RESUME AI ANALYSIS
    // =========================================================

    public async Task<ResumeAIAnalysisDto> AnalyzeResumeAsync(
        string resumeText,
        string skills,
        CancellationToken cancellationToken = default)
    {
        ValidateResumeText(resumeText);

        var apiKey = GetApiKey();

        var prompt = $"""
        You are an expert AI recruitment assistant.

        Analyze the candidate resume using ONLY the information
        provided below.

        ================= CANDIDATE RESUME =================

        {resumeText}

        ================= DETECTED SKILLS =================

        {skills}

        ================= TASK =================

        Provide:

        1. Professional resume summary.
        2. Candidate strengths.
        3. Relevant skills that are missing or could improve the profile.
        4. Practical suggestions for improving the resume.

        ================= RULES =================

        - Analyze only the supplied information.
        - Do not invent experience.
        - Do not invent education.
        - Do not invent certifications.
        - Do not invent projects.
        - Do not invent technologies.
        - Do not assume a skill exists if it is not present.
        - Be specific to the candidate.
        - Avoid generic statements.
        - Suggestions must be practical and actionable.

        Return ONLY valid JSON matching the supplied schema.
        """;

        var body = new
        {
            model = GetModel(),

            input = prompt,

            store = false,

            response_format = BuildJsonResponseFormat(
                BuildGeneralAnalysisSchema())
        };

        return await SendGeminiRequestAsync<ResumeAIAnalysisDto>(
            apiKey,
            body,
            cancellationToken);
    }


    // =========================================================
    // JOB-SPECIFIC RESUME AI ANALYSIS
    // =========================================================

    public async Task<ResumeAIAnalysisDto> AnalyzeResumeForJobAsync(
        string resumeText,
        string skills,
        string jobTitle,
        string jobDescription,
        string jobSkills,
        string preferredSkills,
        string educationRequirements,
        string certificationRequirements,
        int requiredExperience,
        CancellationToken cancellationToken = default)
    {
        ValidateResumeText(resumeText);

        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            throw new ArgumentException(
                "Job title is required for ATS analysis.");
        }

        if (requiredExperience < 0)
        {
            throw new ArgumentException(
                "Required experience cannot be negative.");
        }

        var apiKey = GetApiKey();

        var prompt = $$"""
        You are an expert AI recruitment and ATS evaluation system.

        Evaluate ONE candidate resume against ONE specific job.

        ================= CANDIDATE RESUME =================

        {resumeText}

        ================= CANDIDATE DETECTED SKILLS =================

        {skills}

        ================= JOB INFORMATION =================

        Job Title:
        {jobTitle}

        Required Experience:
        {requiredExperience} years

        Required Skills:
        {jobSkills}

        Preferred Skills:
        {preferredSkills}

        Education Requirements:
        {educationRequirements}

        Certification Requirements:
        {certificationRequirements}

        Job Description:
        {jobDescription}

        ================= EVALUATION =================

        Calculate an ATS score from 0 to 100.

        Evaluate:

        1. Skills Match
        2. Experience Match
        3. Education Match
        4. Certification Match
        5. Project Match
        6. Job Description Match

        Also provide:

        - Candidate summary for THIS job.
        - Candidate strengths relevant to THIS job.
        - Required job skills found in the resume.
        - Important job skills missing from the resume.
        - Practical suggestions for improving the candidate's
          match for THIS job.

        ================= SCORING RULES =================

        Skills Match:
        - Required skills must have significant influence.
        - Exact skills should receive credit.
        - Clearly equivalent technologies may receive reasonable credit.
        - Unrelated skills should receive little or no credit.

        Preferred Skills:
        - Matching preferred skills should improve the score.
        - Missing preferred skills should have less impact than missing required skills.

        Experience Match:
        - Compare actual candidate experience with required experience.
        - Relevant experience should receive higher credit.
        - Never invent experience.

        Education Match:
        - Use only actual education present in the resume.
        - Do not assume a degree.

        Certification Match:
        - Compare candidate certifications with job certification requirements.
        - Relevant certifications should increase the score.

        Project Match:
        - Relevant projects should increase the score.
        - Unrelated projects should have limited impact.

        Job Description Match:
        - Compare actual resume responsibilities and technologies
          against the supplied job description.

        ================= IMPORTANT RULES =================

        - Evaluate THIS candidate against THIS job only.
        - Do not give every candidate the same score.
        - Do not invent information.
        - Missing important required skills must reduce the score.
        - Relevant experience should increase the score.
        - Relevant projects should increase the score.
        - Relevant education should influence the score.
        - Relevant job-description keywords should influence the score.
        - ATSScore must be between 0 and 100.
        - SkillsMatch must be between 0 and 100.
        - ExperienceMatch must be between 0 and 100.
        - EducationMatch must be between 0 and 100.
        - CertificationMatch must be between 0 and 100.
        - ProjectMatch must be between 0 and 100.
        - JobDescriptionMatch must be between 0 and 100.

        Return ONLY valid JSON matching the supplied schema.
        """;

        var body = new
        {
            model = GetModel(),

            input = prompt,

            store = false,

            response_format = BuildJsonResponseFormat(
                BuildJobAnalysisSchema())
        };

        return await SendGeminiRequestAsync<ResumeAIAnalysisDto>(
            apiKey,
            body,
            cancellationToken);
    }


    // =========================================================
    // COMPANY PORTAL - CANDIDATE AI ANALYSIS
    // =========================================================

    public async Task<CompanyCandidateAIAnalysisDto>
        AnalyzeCandidateForCompanyAsync(
            string resumeText,
            string candidateSkills,
            string jobTitle,
            string jobDescription,
            string jobSkills,
            CancellationToken cancellationToken = default)
    {
        ValidateResumeText(resumeText);

        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            throw new ArgumentException(
                "Job title is required for candidate AI analysis.");
        }

        var apiKey = GetApiKey();

        var prompt = $"""
        You are an AI recruitment assistant used by a hiring company.

        Analyze ONE candidate for ONE specific job.

        This is an employer-side candidate insight feature.

        ================= IMPORTANT =================

        - Do NOT calculate an ATS score.
        - Do NOT replace the deterministic ATS keyword score.
        - Do NOT invent skills.
        - Do NOT invent experience.
        - Do NOT invent education.
        - Do NOT invent certifications.
        - Do NOT invent projects.
        - Do NOT assume missing information.
        - Keep the analysis objective and evidence-based.
        - Missing skills must be relevant to the supplied job.

        ================= CANDIDATE RESUME =================

        {resumeText}

        ================= CANDIDATE DETECTED SKILLS =================

        {candidateSkills}

        ================= JOB =================

        Job Title:
        {jobTitle}

        Required Skills:
        {jobSkills}

        Job Description:
        {jobDescription}

        ================= TASK =================

        Provide:

        1. Concise candidate summary for this job.
        2. Candidate strengths relevant to this job.
        3. Important job skills missing from the resume.
        4. Practical suggestions.
        5. Technical or role-specific topics the interviewer
           should focus on.

        Do NOT provide an ATS score.

        Return ONLY valid JSON matching the supplied schema.
        """;

        var body = new
        {
            model = GetModel(),

            input = prompt,

            store = false,

            response_format = BuildJsonResponseFormat(
                BuildCompanyAnalysisSchema())
        };

        var analysis =
            await SendGeminiRequestAsync<CompanyCandidateAIAnalysisDto>(
                apiKey,
                body,
                cancellationToken);

        NormalizeCompanyAnalysis(analysis);

        return analysis;
    }


    // =========================================================
    // COMMON GEMINI REQUEST
    // =========================================================

    private async Task<T> SendGeminiRequestAsync<T>(
        string apiKey,
        object body,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                GeminiUrl);

        // =====================================================
        // HEADERS
        // =====================================================

        request.Headers.Add(
            "x-goog-api-key",
            apiKey);

        request.Headers.Add(
            "Api-Revision",
            ApiRevision);

        request.Content =
            JsonContent.Create(body);

        // =====================================================
        // SEND REQUEST
        // =====================================================

        using var response =
            await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

        var result =
            await response.Content.ReadAsStringAsync(
                cancellationToken);

        // =====================================================
        // API ERROR
        // =====================================================

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Gemini API Error ({(int)response.StatusCode}): {result}");
        }

        // =====================================================
        // PARSE RESPONSE
        // =====================================================

        try
        {
            using var document =
                JsonDocument.Parse(result);

            var root =
                document.RootElement;

            var outputText =
                ExtractOutputText(root);

            if (string.IsNullOrWhiteSpace(outputText))
            {
                throw new InvalidOperationException(
                    "Gemini returned an empty model response.");
            }

            outputText =
                CleanJsonResponse(outputText);

            var data =
                JsonSerializer.Deserialize<T>(
                    outputText,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            if (data == null)
            {
                throw new InvalidOperationException(
                    "Gemini response could not be deserialized.");
            }

            // =================================================
            // NORMALIZATION
            // =================================================

            if (data is ResumeAIAnalysisDto resumeAnalysis)
            {
                NormalizeAnalysis(resumeAnalysis);
            }

            if (data is ResumeParsedDataDto parsedData)
            {
                NormalizeResumeData(parsedData);
            }

            if (data is CompanyCandidateAIAnalysisDto companyAnalysis)
            {
                NormalizeCompanyAnalysis(companyAnalysis);
            }

            return data;


           
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Failed to parse Gemini response. Raw response: {result}",
                ex);
        }
    }


    // =========================================================
    // EXTRACT OUTPUT TEXT
    // =========================================================

    private static string ExtractOutputText(
        JsonElement root)
    {
        // =====================================================
        // OPTION 1 - output_text
        // =====================================================

        if (root.TryGetProperty(
                "output_text",
                out var outputTextProperty))
        {
            if (outputTextProperty.ValueKind ==
                JsonValueKind.String)
            {
                var outputText =
                    outputTextProperty.GetString();

                if (!string.IsNullOrWhiteSpace(outputText))
                {
                    return outputText;
                }
            }
        }

        // =====================================================
        // OPTION 2 - steps
        // =====================================================

        if (!root.TryGetProperty(
                "steps",
                out var steps))
        {
            return string.Empty;
        }

        if (steps.ValueKind !=
            JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var step in steps.EnumerateArray())
        {
            if (!step.TryGetProperty(
                    "type",
                    out var stepType))
            {
                continue;
            }

            if (!string.Equals(
                    stepType.GetString(),
                    "model_output",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!step.TryGetProperty(
                    "content",
                    out var content))
            {
                continue;
            }

            if (content.ValueKind !=
                JsonValueKind.Array)
            {
                continue;
            }

            foreach (var item in content.EnumerateArray())
            {
                if (!item.TryGetProperty(
                        "type",
                        out var itemType))
                {
                    continue;
                }

                if (!string.Equals(
                        itemType.GetString(),
                        "text",
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!item.TryGetProperty(
                        "text",
                        out var textProperty))
                {
                    continue;
                }

                if (textProperty.ValueKind ==
                    JsonValueKind.String)
                {
                    return textProperty.GetString()
                           ?? string.Empty;
                }
            }
        }

        return string.Empty;
    }


    // =========================================================
    // CLEAN JSON RESPONSE
    // =========================================================

    private static string CleanJsonResponse(
        string outputText)
    {
        outputText =
            outputText.Trim();

        if (outputText.StartsWith(
                "```json",
                StringComparison.OrdinalIgnoreCase))
        {
            outputText =
                outputText[7..].Trim();
        }
        else if (outputText.StartsWith(
                     "```",
                     StringComparison.OrdinalIgnoreCase))
        {
            outputText =
                outputText[3..].Trim();
        }

        if (outputText.EndsWith(
                "```",
                StringComparison.OrdinalIgnoreCase))
        {
            outputText =
                outputText[..^3].Trim();
        }

        return outputText;
    }


    // =========================================================
    // GENERAL ANALYSIS SCHEMA
    // =========================================================

    private static object BuildGeneralAnalysisSchema()
    {
        return new
        {
            type = "object",

            properties = new
            {
                summary = new
                {
                    type = "string"
                },

                strengths = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                missingSkills = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                suggestions = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                }
            },

            required = new[]
            {
                "summary",
                "strengths",
                "missingSkills",
                "suggestions"
            }
        };
    }


    // =========================================================
    // JOB ANALYSIS SCHEMA
    // =========================================================

    private static object BuildJobAnalysisSchema()
    {
        return new
        {
            type = "object",

            properties = new
            {
                atsScore = new
                {
                    type = "number"
                },

                skillsMatch = new
                {
                    type = "number"
                },

                experienceMatch = new
                {
                    type = "number"
                },

                educationMatch = new
                {
                    type = "number"
                },

                certificationMatch = new
                {
                    type = "number"
                },

                projectMatch = new
                {
                    type = "number"
                },

                jobDescriptionMatch = new
                {
                    type = "number"
                },

                summary = new
                {
                    type = "string"
                },

                strengths = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                matchedSkills = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                missingSkills = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                suggestions = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                }
            },

            required = new[]
            {
                "atsScore",
                "skillsMatch",
                "experienceMatch",
                "educationMatch",
                "certificationMatch",
                "projectMatch",
                "jobDescriptionMatch",
                "summary",
                "strengths",
                "matchedSkills",
                "missingSkills",
                "suggestions"
            }
        };
    }


    // =========================================================
    // COMPANY ANALYSIS SCHEMA
    // =========================================================

    private static object BuildCompanyAnalysisSchema()
    {
        return new
        {
            type = "object",

            properties = new
            {
                summary = new
                {
                    type = "string"
                },

                strengths = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                missingSkills = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                suggestions = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                },

                interviewFocus = new
                {
                    type = "array",

                    items = new
                    {
                        type = "string"
                    }
                }
            },

            required = new[]
            {
                "summary",
                "strengths",
                "missingSkills",
                "suggestions",
                "interviewFocus"
            }
        };
    }


    // =========================================================
    // RESPONSE FORMAT
    // =========================================================

    private static object BuildJsonResponseFormat(
        object schema)
    {
        return new
        {
            type = "text",

            mime_type = "application/json",

            schema
        };
    }


    // =========================================================
    // NORMALIZE RESUME ANALYSIS
    // =========================================================

    private static void NormalizeAnalysis(
        ResumeAIAnalysisDto analysis)
    {
        analysis.ATSScore =
            Math.Clamp(
                analysis.ATSScore,
                0,
                100);

        analysis.SkillsMatch =
            Math.Clamp(
                analysis.SkillsMatch,
                0,
                100);

        analysis.ExperienceMatch =
            Math.Clamp(
                analysis.ExperienceMatch,
                0,
                100);

        analysis.EducationMatch =
            Math.Clamp(
                analysis.EducationMatch,
                0,
                100);
        analysis.CertificationMatch =
            Math.Clamp(
                analysis.CertificationMatch,
                0,
                100);

        analysis.ProjectMatch =
            Math.Clamp(
                analysis.ProjectMatch,
                0,
                100);

        analysis.JobDescriptionMatch =
            Math.Clamp(
                analysis.JobDescriptionMatch,
                0,
                100);

        analysis.Strengths ??=
            new List<string>();

        analysis.MatchedSkills ??=
            new List<string>();

        analysis.MissingSkills ??=
            new List<string>();

        analysis.Suggestions ??=
            new List<string>();
    }


    // =========================================================
    // NORMALIZE COMPANY ANALYSIS
    // =========================================================

    private static void NormalizeCompanyAnalysis(
        CompanyCandidateAIAnalysisDto analysis)
    {
        if (analysis == null)
        {
            return;
        }

        analysis.Strengths ??=
            new List<string>();

        analysis.MissingSkills ??=
            new List<string>();

        analysis.Suggestions ??=
            new List<string>();

        analysis.InterviewFocus ??=
            new List<string>();
    }


    // =========================================================
    // API KEY
    // =========================================================

    private string GetApiKey()
    {
        var apiKey =
            _configuration[
                "GeminiSettings:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Gemini API key is not configured. " +
                "Run: dotnet user-secrets set \"GeminiSettings:ApiKey\" \"YOUR_API_KEY\"");
        }

        return apiKey.Trim();
    }


    // =========================================================
    // MODEL
    // =========================================================

    private string GetModel()
    {
        var model =
            _configuration[
                "GeminiSettings:Model"];

        if (string.IsNullOrWhiteSpace(model))
        {
            throw new InvalidOperationException(
                "Gemini model is not configured. " +
                "Configure GeminiSettings:Model in appsettings.json.");
        }

        return model.Trim();
    }


    // =========================================================
    // RESUME VALIDATION
    // =========================================================

    private static void ValidateResumeText(
        string resumeText)
    {
        if (string.IsNullOrWhiteSpace(resumeText))
        {
            throw new ArgumentException(
                "Resume text is empty.");
        }
    }
}