using System.Net.Http.Json;
using System.Text.Json;
using Backend.DTOs.Resume;
using Backend.Interfaces.Services;

namespace Backend.Services.Resumes;

public sealed class ResumeAIService : IResumeAIService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ResumeAIService> _logger;

    // =========================================================
    // GEMINI INTERACTIONS API
    // =========================================================

    private const string GeminiUrl =
        "https://generativelanguage.googleapis.com/v1beta/interactions";

    private const string ApiRevision =
        "2026-05-20";

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ResumeAIService(
        IConfiguration configuration,
        HttpClient httpClient,
        ILogger<ResumeAIService> logger)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
    }

    // =========================================================
    // RESUME DATA EXTRACTION
    // =========================================================

    public async Task<ResumeParsedDataDto> ExtractResumeDataAsync(
        string resumeText,
        CancellationToken cancellationToken)
    {
        ValidateResumeText(resumeText);

        var apiKey = GetApiKey();

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
            await SendGeminiRequestAsync<ResumeParsedDataDto>(
                apiKey,
                body,
                cancellationToken);

        NormalizeResumeData(data);

        return data;
    }

    // =========================================================
    // NORMALIZE RESUME DATA
    // =========================================================

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

    // =========================================================
    // RESUME EXTRACTION SCHEMA
    // =========================================================

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
            response_format =
                BuildJsonResponseFormat(
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

        var prompt = $"""
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
            response_format =
                BuildJsonResponseFormat(
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
            string qualification,
            string course,
            string collegeName,
            int candidateExperience,
            string jobTitle,
            string jobDescription,
            string jobSkills,
            string preferredSkills,
            string educationRequirements,
            string certificationRequirements,
            int requiredExperience,
            bool requiresPortfolio,
            CancellationToken cancellationToken = default)
    {
        ValidateResumeText(resumeText);

        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            throw new ArgumentException(
                "Job title is required for candidate AI analysis.");
        }

        if (candidateExperience < 0)
        {
            throw new ArgumentException(
                "Candidate experience cannot be negative.");
        }

        if (requiredExperience < 0)
        {
            throw new ArgumentException(
                "Required experience cannot be negative.");
        }

        var apiKey = GetApiKey();

        // =====================================================
        // COMPANY-SIDE SEMANTIC JOB MATCHING
        // =====================================================

        var prompt = $"""
        You are an expert AI recruitment assistant used by a hiring company.

        Analyze ONE candidate for ONE specific job.

        Your task is to determine how well this candidate actually
        matches the supplied job using semantic and contextual reasoning.

        This is an employer-side candidate insight feature.

        =========================================================
        IMPORTANT DISTINCTION
        =========================================================

        Generate a separate AI-based Job Match Score from 0 to 100.

        JobMatchScore is NOT the existing ATSScore.

        Do NOT calculate or return the candidate's existing ATSScore.

        JobMatchScore represents semantic job fit based on the complete
        candidate and job context supplied below.

        =========================================================
        CANDIDATE APPLICATION INFORMATION
        =========================================================

        Candidate Name:
        Candidate information is supplied through the application context.

        Qualification:
        {qualification}

        Course:
        {course}

        College:
        {collegeName}

        Candidate Experience:
        {candidateExperience} years

        Candidate Skills:
        {candidateSkills}

        =========================================================
        IMMUTABLE APPLICATION RESUME SNAPSHOT
        =========================================================

        Use this resume snapshot as the source of truth for the candidate's
        resume content.

        {resumeText}

        =========================================================
        JOB INFORMATION
        =========================================================

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

        Portfolio Required:
        {requiresPortfolio}

        Job Description:
        {jobDescription}

        =========================================================
        SEMANTIC MATCHING RULES
        =========================================================

        Evaluate the candidate using the complete context above.

        Do NOT rely on exact keyword matching alone.

        Understand the meaning and context of:

        - Job title
        - Job responsibilities
        - Required technologies
        - Preferred technologies
        - Candidate skills
        - Resume experience
        - Resume projects
        - Candidate education
        - Certifications
        - Relevant responsibilities
        - Relevant technical domains

        A candidate does NOT need to use the exact same job title
        wording to be considered a strong match.

        For example, if the job title describes a full-stack Java role
        and the candidate resume demonstrates Java, Spring Boot,
        Spring/Hibernate, database experience, React and JavaScript,
        evaluate the overall technical and responsibility alignment
        rather than requiring the literal phrase "Java Full Stack Developer".

        However, do NOT use hardcoded assumptions or predefined
        skill dictionaries.

        Determine relationships from the actual supplied job description,
        requirements and candidate evidence.

        Clearly related or semantically equivalent technologies may receive
        reasonable credit ONLY when the supplied candidate information
        provides evidence for that relationship.

        =========================================================
        NO INVENTION RULE
        =========================================================

        Never invent:

        - Skills
        - Technologies
        - Work experience
        - Job responsibilities
        - Education
        - Certifications
        - Projects
        - Portfolio
        - Tools
        - Cloud platforms
        - Years of experience

        If a required skill such as Docker, AWS, Kubernetes or another
        technology is not supported by the supplied candidate evidence,
        do not assume the candidate knows it.

        Mark it as missing or insufficient evidence when relevant.

        Semantic matching is allowed.

        Unsupported assumptions are NOT allowed.

        =========================================================
        JOB MATCH SCORE
        =========================================================

        Generate JobMatchScore from 0 to 100.

        Consider the following factors holistically:

        - Required technical skills
        - Relevant professional experience
        - Alignment with job responsibilities
        - Relevant projects and resume evidence
        - Qualification and education
        - Preferred skills
        - Certification requirements
        - Portfolio requirement when applicable

        Suggested evaluation emphasis:

        Required technical skills:
        approximately 35%

        Relevant experience:
        approximately 25%

        Job responsibility alignment:
        approximately 20%

        Resume/projects relevance:
        approximately 10%

        Qualification/education:
        approximately 10%

        These percentages are guidance for consistent evaluation,
        not a hardcoded formula.

        Use professional judgment based on the actual job.

        A candidate with strong contextual alignment should receive
        a high score even if the exact job title phrase is absent.

        A candidate with many unrelated keywords should NOT receive
        a high score merely because keywords appear.

        Missing critical requirements should materially reduce the score.

        =========================================================
        SCORE INTERPRETATION
        =========================================================

        90-100:

        Excellent overall match. Candidate evidence strongly aligns
        with the role and most important requirements.

        75-89:

        Strong match. Candidate has substantial relevant alignment
        with some manageable gaps.

        60-74:

        Moderate match. Candidate has useful relevant experience
        but has meaningful gaps.

        40-59:

        Weak-to-moderate match. Some relevant evidence exists,
        but important requirements are missing or insufficiently supported.

        0-39:

        Poor match. Candidate evidence has limited alignment
        with the supplied job.

        Do not force a score into a category. Base the score on evidence.

        =========================================================
        REQUIRED OUTPUT
        =========================================================

        Provide:

        1. JobMatchScore
           AI-generated semantic job fit score from 0 to 100.

        2. Summary
           A concise employer-focused summary explaining why the
           candidate does or does not match this specific job.

        3. Strengths
           Candidate strengths that are directly relevant to this job.

        4. MissingSkills
           Important job requirements for which the candidate has
           no sufficient evidence.

        5. Suggestions
           Practical improvement suggestions based on actual gaps.

        6. InterviewFocus
           Technical, role-specific or experience areas that the
           interviewer should verify during the interview.

        =========================================================
        IMPORTANT OUTPUT RULES
        =========================================================

        - JobMatchScore must be an integer between 0 and 100.
        - Do not return ATSScore.
        - Do not reuse or expose the existing ATSScore.
        - Do not simply count matching keywords.
        - Use semantic/contextual understanding.
        - Do not give every candidate the same score.
        - Do not invent candidate information.
        - MissingSkills must be relevant to the supplied job.
        - InterviewFocus should contain verification areas,
          not invented candidate facts.
        - Summary must be specific to this candidate and this job.
        - Suggestions must be practical.
        - Keep the analysis objective and evidence-based.
        - Return ONLY valid JSON matching the supplied schema.
        """;

        var body = new
        {
            model = GetModel(),
            input = prompt,
            store = false,
            response_format =
                BuildJsonResponseFormat(
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

        var model = GetModel();

        _logger.LogInformation(
            "Gemini AI request started. Model: {Model}",
            model);

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

        request.Headers.Accept.Clear();

        request.Headers.Accept.Add(
            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue(
                "application/json"));

        request.Content =
            JsonContent.Create(body);

        // =====================================================
        // SEND REQUEST
        // =====================================================

        HttpResponseMessage response;

        try
        {
            response =
                await _httpClient.SendAsync(
                    request,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);
        }
        catch (OperationCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError(
                "Gemini AI request timed out. Model: {Model}",
                model);

            throw new InvalidOperationException(
                "Gemini AI request timed out.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(
                ex,
                "Unable to connect to Gemini API. Model: {Model}",
                model);

            throw new InvalidOperationException(
                "Unable to connect to Gemini AI service.",
                ex);
        }

        using (response)
        {
            var result =
                await response.Content.ReadAsStringAsync(
                    cancellationToken);

            _logger.LogInformation(
                "Gemini API response received. Status: {StatusCode}, Model: {Model}",
                (int)response.StatusCode,
                model);

            // =================================================
            // API ERROR
            // =================================================

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Gemini API request failed. Status: {StatusCode}, Model: {Model}, Response: {Response}",
                    (int)response.StatusCode,
                    model,
                    result);

                throw new InvalidOperationException(
                    $"Gemini API Error ({(int)response.StatusCode}): {result}");
            }

            // =================================================
            // EMPTY RESPONSE
            // =================================================

            if (string.IsNullOrWhiteSpace(result))
            {
                _logger.LogError(
                    "Gemini returned an empty HTTP response. Model: {Model}",
                    model);

                throw new InvalidOperationException(
                    "Gemini returned an empty HTTP response.");
            }

            // =================================================
            // PARSE RESPONSE
            // =================================================

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
                    _logger.LogError(
                        "Gemini returned a successful response but no model text was found. Model: {Model}. Response: {Response}",
                        model,
                        result);

                    throw new InvalidOperationException(
                        "Gemini returned an empty model response.");
                }

                outputText =
                    CleanJsonResponse(outputText);

                if (string.IsNullOrWhiteSpace(outputText))
                {
                    throw new InvalidOperationException(
                        "Gemini returned an empty JSON response.");
                }

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

                _logger.LogInformation(
                    "Gemini AI response parsed successfully. Model: {Model}",
                    model);

                return data;
            }
            catch (JsonException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to parse Gemini JSON response. Model: {Model}. Raw response: {Response}",
                    model,
                    result);

                throw new InvalidOperationException(
                    $"Failed to parse Gemini response. Raw response: {result}",
                    ex);
            }
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

        if (root.TryGetProperty(
                "steps",
                out var steps))
        {
            var result =
                ExtractTextFromSteps(steps);

            if (!string.IsNullOrWhiteSpace(result))
            {
                return result;
            }
        }

        // =====================================================
        // OPTION 3 - output
        // =====================================================

        if (root.TryGetProperty(
                "output",
                out var output))
        {
            var result =
                ExtractTextFromOutput(output);

            if (!string.IsNullOrWhiteSpace(result))
            {
                return result;
            }
        }

        return string.Empty;
    }

    // =========================================================
    // EXTRACT TEXT FROM STEPS
    // =========================================================

    private static string ExtractTextFromSteps(
        JsonElement steps)
    {
        if (steps.ValueKind !=
            JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var step in steps.EnumerateArray())
        {
            // -------------------------------------------------
            // Only model_output steps
            // -------------------------------------------------

            if (step.TryGetProperty(
                    "type",
                    out var stepType))
            {
                var type =
                    stepType.GetString();

                if (!string.Equals(
                        type,
                        "model_output",
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }
            }

            // -------------------------------------------------
            // content
            // -------------------------------------------------

            if (!step.TryGetProperty(
                    "content",
                    out var content))
            {
                continue;
            }

            var text =
                ExtractTextFromContent(content);

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return string.Empty;
    }

    // =========================================================
    // EXTRACT TEXT FROM OUTPUT
    // =========================================================

    private static string ExtractTextFromOutput(
        JsonElement output)
    {
        // -----------------------------------------------------
        // output can be an array
        // -----------------------------------------------------

        if (output.ValueKind ==
            JsonValueKind.Array)
        {
            foreach (var item in output.EnumerateArray())
            {
                // Direct text
                if (item.ValueKind ==
                    JsonValueKind.String)
                {
                    var directText =
                        item.GetString();

                    if (!string.IsNullOrWhiteSpace(
                            directText))
                    {
                        return directText;
                    }
                }

                // Object content
                if (item.ValueKind ==
                    JsonValueKind.Object)
                {
                    if (item.TryGetProperty(
                            "content",
                            out var content))
                    {
                        var text =
                            ExtractTextFromContent(content);

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            return text;
                        }
                    }

                    if (item.TryGetProperty(
                            "text",
                            out var textProperty) &&
                        textProperty.ValueKind ==
                            JsonValueKind.String)
                    {
                        var text =
                            textProperty.GetString();

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            return text;
                        }
                    }
                }
            }
        }

        // -----------------------------------------------------
        // output can be an object
        // -----------------------------------------------------

        if (output.ValueKind ==
            JsonValueKind.Object)
        {
            if (output.TryGetProperty(
                    "text",
                    out var textProperty) &&
                textProperty.ValueKind ==
                    JsonValueKind.String)
            {
                return textProperty.GetString()
                       ?? string.Empty;
            }

            if (output.TryGetProperty(
                    "content",
                    out var content))
            {
                return ExtractTextFromContent(content);
            }
        }

        return string.Empty;
    }

    // =========================================================
    // EXTRACT TEXT FROM CONTENT
    // =========================================================

    private static string ExtractTextFromContent(
        JsonElement content)
    {
        // -----------------------------------------------------
        // Content array
        // -----------------------------------------------------

        if (content.ValueKind ==
            JsonValueKind.Array)
        {
            foreach (var item in content.EnumerateArray())
            {
                // Direct string
                if (item.ValueKind ==
                    JsonValueKind.String)
                {
                    var directText =
                        item.GetString();

                    if (!string.IsNullOrWhiteSpace(
                            directText))
                    {
                        return directText;
                    }
                }

                // Object
                if (item.ValueKind ==
                    JsonValueKind.Object)
                {
                    // type = text
                    if (item.TryGetProperty(
                            "type",
                            out var itemType))
                    {
                        var type =
                            itemType.GetString();

                        if (!string.Equals(
                                type,
                                "text",
                                StringComparison.OrdinalIgnoreCase))
                        {
                            // Continue only when a direct text
                            // property exists below.
                        }
                    }

                    if (item.TryGetProperty(
                            "text",
                            out var textProperty) &&
                        textProperty.ValueKind ==
                            JsonValueKind.String)
                    {
                        var text =
                            textProperty.GetString();

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            return text;
                        }
                    }

                    // Some response variants may nest content.
                    if (item.TryGetProperty(
                            "content",
                            out var nestedContent))
                    {
                        var nestedText =
                            ExtractTextFromContent(
                                nestedContent);

                        if (!string.IsNullOrWhiteSpace(
                                nestedText))
                        {
                            return nestedText;
                        }
                    }
                }
            }
        }

        // -----------------------------------------------------
        // Content object
        // -----------------------------------------------------

        if (content.ValueKind ==
            JsonValueKind.Object)
        {
            if (content.TryGetProperty(
                    "text",
                    out var textProperty) &&
                textProperty.ValueKind ==
                    JsonValueKind.String)
            {
                return textProperty.GetString()
                       ?? string.Empty;
            }

            if (content.TryGetProperty(
                    "content",
                    out var nestedContent))
            {
                return ExtractTextFromContent(
                    nestedContent);
            }
        }

        // -----------------------------------------------------
        // Content itself is a string
        // -----------------------------------------------------

        if (content.ValueKind ==
            JsonValueKind.String)
        {
            return content.GetString()
                   ?? string.Empty;
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

        // -----------------------------------------------------
        // Remove markdown code fence
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // Remove accidental surrounding whitespace
        // -----------------------------------------------------

        outputText =
            outputText.Trim();

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
                jobMatchScore = new
                {
                    type = "integer"
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
                "jobMatchScore",
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
        if (analysis == null)
        {
            return;
        }

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

        analysis.JobMatchScore =
            Math.Clamp(
                analysis.JobMatchScore,
                0,
                100);

        analysis.Summary ??=
            string.Empty;

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
            _logger.LogError(
                "Gemini API key is not configured.");

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
            _logger.LogError(
                "Gemini model is not configured.");

            throw new InvalidOperationException(
                "Gemini model is not configured. " +
                "Configure GeminiSettings:Model in appsettings.json or User Secrets.");
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