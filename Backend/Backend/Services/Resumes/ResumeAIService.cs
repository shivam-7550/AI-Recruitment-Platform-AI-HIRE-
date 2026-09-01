using System.Net.Http.Json;
using System.Text.Json;
using Backend.DTOs.Resume;
using Backend.Interfaces.Services;

namespace Backend.Services.Resumes;

public class ResumeAIService : IResumeAIService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    private const string GeminiUrl =
        "https://generativelanguage.googleapis.com/v1beta/interactions";

    private const string GeminiModel =
        "gemini-3.6-flash";


    public ResumeAIService(
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }


    // =========================================================
    // GENERAL RESUME AI ANALYSIS
    // =========================================================

    public async Task<ResumeAIAnalysisDto> AnalyzeResumeAsync(
        string resumeText,
        string skills)
    {
        var apiKey =
            GetApiKey();

        ValidateResumeText(
            resumeText);


        // =====================================================
        // PROMPT
        // =====================================================

        var prompt = $"""
        You are an expert AI recruitment assistant.

        Analyze the following candidate resume carefully.

        =====================================================
        CANDIDATE RESUME
        =====================================================

        {resumeText}

        =====================================================
        DETECTED SKILLS
        =====================================================

        {skills}

        =====================================================
        TASK
        =====================================================

        Analyze ONLY the information available in the resume.

        Provide:

        1. Resume Summary
        2. Top Strengths
        3. Missing Skills
        4. Suggestions for Improvement

        =====================================================
        IMPORTANT RULES
        =====================================================

        - Be specific to this candidate.
        - Do NOT give generic statements.
        - Consider education.
        - Consider work experience.
        - Consider projects.
        - Consider technical skills.
        - Consider soft skills.
        - Consider certifications.
        - Consider technologies.
        - Consider the overall candidate profile.
        - Do NOT invent experience.
        - Do NOT invent skills.
        - Do NOT invent certifications.
        - Do NOT assume technologies that are not present.
        - Missing skills should contain skills that would realistically
          improve the candidate's profile.
        - Suggestions should be practical and actionable.

        Return ONLY valid JSON matching the requested schema.
        """;


        // =====================================================
        // REQUEST BODY
        // =====================================================

        var body = new
        {
            model = GeminiModel,

            input = prompt,

            store = false,

            response_format = new
            {
                type = "text",

                mime_type = "application/json",

                schema = new
                {
                    type = "object",

                    properties = new
                    {
                        summary = new
                        {
                            type = "string",

                            description =
                                "Concise professional summary of the candidate."
                        },

                        strengths = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Candidate's strongest skills, experience and qualifications."
                        },

                        missingSkills = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Relevant skills missing from the candidate profile."
                        },

                        suggestions = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Practical suggestions for improving the resume."
                        }
                    },

                    required = new[]
                    {
                        "summary",
                        "strengths",
                        "missingSkills",
                        "suggestions"
                    }
                }
            }
        };


        return await SendGeminiRequestAsync<ResumeAIAnalysisDto>(
            apiKey,
            body);
    }


    // =========================================================
    // JOB-SPECIFIC ATS ANALYSIS
    // =========================================================

    public async Task<ResumeAIAnalysisDto>
        AnalyzeResumeForJobAsync(
            string resumeText,
            string skills,
            string jobTitle,
            string jobDescription,
            string jobSkills,
            int requiredExperience)
    {
        var apiKey =
            GetApiKey();

        ValidateResumeText(
            resumeText);


        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            throw new ArgumentException(
                "Job title is required for ATS analysis.");
        }


        // =====================================================
        // PROMPT
        // =====================================================

        var prompt = $"""
        You are an expert AI recruitment and ATS evaluation system.

        Your task is to evaluate ONE candidate resume against
        ONE SPECIFIC JOB.

        =====================================================
        CANDIDATE RESUME
        =====================================================

        {resumeText}

        =====================================================
        CANDIDATE DETECTED SKILLS
        =====================================================

        {skills}

        =====================================================
        JOB INFORMATION
        =====================================================

        Job Title:
        {jobTitle}

        Required Experience:
        {requiredExperience} years

        Required Skills:
        {jobSkills}

        Job Description:
        {jobDescription}

        =====================================================
        ATS EVALUATION
        =====================================================

        Calculate an ATS score from 0 to 100.

        Evaluate the candidate using:

        1. Skills Match
        2. Experience Match
        3. Education Match
        4. Project Match
        5. Job Description Match

        Also provide:

        - Overall candidate summary
        - Candidate strengths relevant to THIS JOB
        - Skills from the job that are present in the resume
        - Skills required by the job but missing from the resume
        - Practical suggestions for improving the candidate's
          chances for THIS JOB

        =====================================================
        SCORING GUIDELINES
        =====================================================

        Skills Match:
        - Required job skills should have significant influence.
        - Exact and clearly equivalent skills should count.
        - Unrelated skills should not receive significant credit.

        Experience Match:
        - Compare candidate experience with required experience.
        - Relevant experience should receive higher credit.
        - Do not invent experience.

        Education Match:
        - Consider the candidate's actual education.
        - Do not assume a degree that is not present.

        Project Match:
        - Relevant projects should increase the score.
        - Unrelated projects should have limited impact.

        Job Description Match:
        - Compare actual resume content with the job description.
        - Relevant responsibilities and technologies should increase
          the score.

        =====================================================
        IMPORTANT RULES
        =====================================================

        - Evaluate the candidate against THIS JOB ONLY.
        - Do NOT give every resume the same score.
        - Do NOT invent candidate experience.
        - Do NOT invent candidate skills.
        - Do NOT assume a skill exists.
        - Required skills must have significant influence.
        - Missing important required skills must reduce the score.
        - Relevant experience should increase the score.
        - Relevant projects should increase the score.
        - Relevant education should influence the score.
        - Relevant job-description keywords should influence the score.
        - Unrelated skills should not receive significant credit.
        - Be objective and consistent.
        - ATSScore must be between 0 and 100.
        - SkillsMatch must be between 0 and 100.
        - ExperienceMatch must be between 0 and 100.
        - EducationMatch must be between 0 and 100.
        - ProjectMatch must be between 0 and 100.
        - JobDescriptionMatch must be between 0 and 100.

        Return ONLY valid JSON matching the requested schema.
        """;


        // =====================================================
        // REQUEST BODY
        // =====================================================

        var body = new
        {
            model = GeminiModel,

            input = prompt,

            store = false,

            response_format = new
            {
                type = "text",

                mime_type = "application/json",

                schema = new
                {
                    type = "object",

                    properties = new
                    {
                        atsScore = new
                        {
                            type = "number",

                            description =
                                "Overall ATS score between 0 and 100."
                        },

                        skillsMatch = new
                        {
                            type = "number",

                            description =
                                "Percentage match between candidate skills and job skills."
                        },

                        experienceMatch = new
                        {
                            type = "number",

                            description =
                                "Percentage match between candidate experience and required experience."
                        },

                        educationMatch = new
                        {
                            type = "number",

                            description =
                                "Percentage relevance of candidate education to the job."
                        },

                        projectMatch = new
                        {
                            type = "number",

                            description =
                                "Percentage relevance of candidate projects to the job."
                        },

                        jobDescriptionMatch = new
                        {
                            type = "number",

                            description =
                                "Percentage relevance between resume and job description."
                        },

                        summary = new
                        {
                            type = "string",

                            description =
                                "Candidate summary specifically for this job."
                        },

                        strengths = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Candidate strengths relevant to this job."
                        },

                        matchedSkills = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Job skills that are present in the candidate resume."
                        },

                        missingSkills = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Important job skills missing from the candidate resume."
                        },

                        suggestions = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Practical suggestions for improving candidate-job match."
                        }
                    },

                    required = new[]
                    {
                        "atsScore",
                        "skillsMatch",
                        "experienceMatch",
                        "educationMatch",
                        "projectMatch",
                        "jobDescriptionMatch",
                        "summary",
                        "strengths",
                        "matchedSkills",
                        "missingSkills",
                        "suggestions"
                    }
                }
            }
        };


        return await SendGeminiRequestAsync<ResumeAIAnalysisDto>(
            apiKey,
            body);
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
            CancellationToken cancellationToken)
    {
        var apiKey = GetApiKey();

        ValidateResumeText(resumeText);

        if (string.IsNullOrWhiteSpace(jobTitle))
        {
            throw new ArgumentException(
                "Job title is required for candidate AI analysis.");
        }

        var prompt = $"""
        You are an AI recruitment assistant used by a hiring company.

        Analyze ONE candidate for ONE specific job using only the supplied information.
        This is an employer-side candidate insight feature.

        IMPORTANT:
        - Do NOT calculate or invent an ATS score.
        - Do NOT replace the deterministic ATS keyword score.
        - Do NOT invent skills, experience, education, certifications, or projects.
        - Only identify missing skills when they are relevant to the supplied job.
        - Keep the recommendation objective and evidence-based.

        ================= CANDIDATE RESUME =================
        {resumeText}

        ================= CANDIDATE DETECTED SKILLS =================
        {candidateSkills}

        ================= JOB =================
        Title: {jobTitle}
        Required Skills: {jobSkills}
        Job Description: {jobDescription}

        ================= TASK =================
        Provide:
        1. A concise candidate summary for this job.
        2. Candidate strengths relevant to this job.
        3. Important job skills that appear to be missing from the resume.
        4. Practical hiring/resume suggestions.
        5. Specific technical or role-related topics the interviewer should focus on.

        Return ONLY valid JSON matching the requested schema.
        """;

        var body = new
        {
            model = GeminiModel,
            input = prompt,
            store = false,
            response_format = new
            {
                type = "text",
                mime_type = "application/json",
                schema = new
                {
                    type = "object",
                    properties = new
                    {
                        summary = new { type = "string" },
                        strengths = new
                        {
                            type = "array",
                            items = new { type = "string" }
                        },
                        missingSkills = new
                        {
                            type = "array",
                            items = new { type = "string" }
                        },
                        suggestions = new
                        {
                            type = "array",
                            items = new { type = "string" }
                        },
                        interviewFocus = new
                        {
                            type = "array",
                            items = new { type = "string" }
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
                }
            }
        };

        // The current HttpClient implementation does not need a request-specific
        // cancellation overload, but honour cancellation before making the call.
        cancellationToken.ThrowIfCancellationRequested();

        var analysis = await SendGeminiRequestAsync<CompanyCandidateAIAnalysisDto>(
            apiKey,
            body);

        analysis.Strengths ??= new List<string>();
        analysis.MissingSkills ??= new List<string>();
        analysis.Suggestions ??= new List<string>();
        analysis.InterviewFocus ??= new List<string>();

        return analysis;
    }


    // =========================================================
    // COMMON GEMINI REQUEST
    // =========================================================

    private async Task<T>
        SendGeminiRequestAsync<T>(
            string apiKey,
            object body)
    {
        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                GeminiUrl);


        // =====================================================
        // API KEY
        // =====================================================

        request.Headers.Add(
            "x-goog-api-key",
            apiKey);


        // =====================================================
        // REQUEST BODY
        // =====================================================

        request.Content =
            JsonContent.Create(body);


        // =====================================================
        // SEND REQUEST
        // =====================================================

        using var response =
            await _httpClient.SendAsync(request);


        var result =
            await response.Content.ReadAsStringAsync();


        // =====================================================
        // GEMINI ERROR
        // =====================================================

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception(
                $"Gemini API Error ({(int)response.StatusCode}): {result}");
        }


        // =====================================================
        // PARSE RESPONSE
        // =====================================================

        try
        {
            using var jsonDocument =
                JsonDocument.Parse(result);

            var root =
                jsonDocument.RootElement;


            var outputText =
                ExtractOutputText(root);


            if (string.IsNullOrWhiteSpace(outputText))
            {
                throw new Exception(
                    $"Gemini returned an empty response. Raw response: {result}");
            }


            // =================================================
            // CLEAN JSON
            // =================================================

            outputText =
                CleanJsonResponse(
                    outputText);


            // =================================================
            // DESERIALIZE
            // =================================================

            var data =
                JsonSerializer.Deserialize<T>(
                    outputText,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });


            if (data == null)
            {
                throw new Exception(
                    $"Unable to deserialize Gemini response. Raw response: {result}");
            }


            // =================================================
            // SPECIAL HANDLING FOR RESUME ANALYSIS
            // =================================================

            if (data is ResumeAIAnalysisDto analysis)
            {
                NormalizeAnalysis(
                    analysis);
            }


            return data;
        }
        catch (JsonException ex)
        {
            throw new Exception(
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
        var outputText =
            string.Empty;


        // =====================================================
        // OPTION 1
        // output_text
        // =====================================================

        if (root.TryGetProperty(
                "output_text",
                out var outputTextProperty))
        {
            if (outputTextProperty.ValueKind ==
                JsonValueKind.String)
            {
                outputText =
                    outputTextProperty.GetString()
                    ?? string.Empty;
            }
        }


        if (!string.IsNullOrWhiteSpace(outputText))
        {
            return outputText;
        }


        // =====================================================
        // OPTION 2
        // steps
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


        foreach (var step in
                 steps.EnumerateArray())
        {
            if (!step.TryGetProperty(
                    "type",
                    out var type))
            {
                continue;
            }


            if (type.GetString() !=
                "model_output")
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


            foreach (var item in
                     content.EnumerateArray())
            {
                if (!item.TryGetProperty(
                        "type",
                        out var itemType))
                {
                    continue;
                }


                if (itemType.GetString() !=
                    "text")
                {
                    continue;
                }


                if (item.TryGetProperty(
                        "text",
                        out var textProperty))
                {
                    outputText +=
                        textProperty.GetString()
                        ?? string.Empty;
                }
            }
        }


        return outputText;
    }


    // =========================================================
    // CLEAN JSON RESPONSE
    // =========================================================

    private static string CleanJsonResponse(
        string outputText)
    {
        outputText =
            outputText.Trim();


        // =====================================================
        // Remove ```json
        // =====================================================

        if (outputText.StartsWith(
                "```json",
                StringComparison.OrdinalIgnoreCase))
        {
            outputText =
                outputText.Substring(7);
        }
        else if (outputText.StartsWith(
                     "```"))
        {
            outputText =
                outputText.Substring(3);
        }


        // =====================================================
        // Remove ```
        // =====================================================

        if (outputText.EndsWith(
                "```"))
        {
            outputText =
                outputText.Substring(
                    0,
                    outputText.Length - 3);
        }


        return outputText.Trim();
    }


    // =========================================================
    // NORMALIZE ANALYSIS
    // =========================================================

    private static void NormalizeAnalysis(
        ResumeAIAnalysisDto analysis)
    {
        // =====================================================
        // SCORE LIMITS
        // =====================================================

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


        // =====================================================
        // NULL-SAFE COLLECTIONS
        // =====================================================

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
    // API KEY
    // =========================================================

    private string GetApiKey()
    {
        var apiKey =
            _configuration["Gemini:ApiKey"]
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");


        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new Exception(
                "Gemini API key not configured.");
        }


        return apiKey.Trim();
    }


    // =========================================================
    // VALIDATE RESUME
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