using Backend.Interfaces.ATS;
using Backend.Models;
using System.Text.RegularExpressions;

namespace Backend.Services.ATS;

public sealed class ATSService : IATSService
{
    // =========================================================
    // GENERAL RESUME ATS SCORE
    // =========================================================

    public double CalculateResumeScore(Resume resume)
    {
        if (resume == null ||
            string.IsNullOrWhiteSpace(resume.ResumeText))
        {
            return 0;
        }

        // This is a deterministic resume ATS-readiness score.
        // It does not call AI. Job-specific matching is handled below.
        var text = resume.ResumeText;
        var skills = SplitSkills(resume.ExtractedSkills);

        if (skills.Count == 0)
        {
            return 0;
        }

        var normalizedText = NormalizeText(text);

        var matchedKeywords = skills.Count(skill =>
            ContainsKeyword(normalizedText, skill));

        return Math.Round(
            (double)matchedKeywords / skills.Count * 100,
            2);
    }


    // =========================================================
    // JOB MATCHING SCORE
    // =========================================================

    public double CalculateJobMatchScore(
        Resume resume,
        Job job)
    {
        if (resume == null || job == null)
        {
            return 0;
        }

        var requiredKeywords =
            SplitSkills(job.Skills);

        if (requiredKeywords.Count == 0 ||
            string.IsNullOrWhiteSpace(resume.ResumeText))
        {
            return 0;
        }

        var normalizedResume =
            NormalizeText(resume.ResumeText);

        var matched = requiredKeywords.Count(keyword =>
            ContainsKeyword(normalizedResume, keyword));

        return Math.Round(
            (double)matched / requiredKeywords.Count * 100,
            2);
    }


    // =========================================================
    // SKILL COVERAGE
    // =========================================================

    private static double SkillCoverage(
        string? resumeSkills,
        string? jobSkills)
    {
        var resume =
            SplitSkills(resumeSkills);

        var required =
            SplitSkills(jobSkills);

        if (required.Count == 0)
            return 0;

        var matched =
            required.Count(
                resume.Contains);

        return (double)matched /
               required.Count;
    }


    // =========================================================
    // EXPERIENCE COVERAGE
    // =========================================================

    private static double ExperienceCoverage(
        Resume resume,
        string text,
        int requiredYears)
    {
        if (requiredYears <= 0)
            return 1;

        var detected =
            resume.Experience;

        foreach (Match match in Regex.Matches(
            text,
            @"\b(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b",
            RegexOptions.IgnoreCase))
        {
            if (int.TryParse(
                match.Groups[1].Value,
                out var years))
            {
                detected =
                    Math.Max(
                        detected,
                        years);
            }
        }

        return Math.Clamp(
            (double)detected / requiredYears,
            0,
            1);
    }


    // =========================================================
    // FORMATTING QUALITY
    // =========================================================

    private static double FormattingQuality(
        string text,
        Resume resume)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        var checks = 0;

        var words =
            Regex.Matches(
                text,
                @"\b\w+\b").Count;

        if (words is >= 150 and <= 1500)
            checks++;

        if (!string.IsNullOrWhiteSpace(resume.Email) ||
            Regex.IsMatch(
                text,
                @"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b"))
        {
            checks++;
        }

        if (!string.IsNullOrWhiteSpace(resume.PhoneNumber) ||
            Regex.IsMatch(
                text,
                @"(?:\+?\d[\d\s-]{8,}\d)"))
        {
            checks++;
        }

        if (HasAny(
            text,
            "skills",
            "experience",
            "education",
            "projects"))
        {
            checks++;
        }

        if (text.Split(
                '\n',
                StringSplitOptions.RemoveEmptyEntries)
            .Length >= 8)
        {
            checks++;
        }

        return checks / 5d;
    }


    // =========================================================
    // KEYWORD DENSITY
    // =========================================================

    private static double KeywordDensity(
        string text,
        string? jobSkills)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        var keywords =
            SplitSkills(jobSkills);

        if (keywords.Count == 0)
            return 0;

        var words =
            Math.Max(
                Regex.Matches(
                    text,
                    @"\b\w+\b").Count,
                1);

        var occurrences =
            keywords.Sum(
                keyword =>
                    Regex.Matches(
                        text,
                        Regex.Escape(keyword),
                        RegexOptions.IgnoreCase)
                    .Count);

        return Math.Clamp(
            ((double)occurrences / words) / 0.02,
            0,
            1);
    }


    // =========================================================
    // SPLIT SKILLS
    // =========================================================

    private static HashSet<string> SplitSkills(
        string? value)
    {
        return (value ?? string.Empty)
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries |
                StringSplitOptions.TrimEntries)
            .Select(
                skill => skill.ToLowerInvariant())
            .ToHashSet();
    }


    // =========================================================
    // SEARCH TEXT
    // =========================================================

    private static bool HasAny(
        string text,
        params string[] terms)
    {
        return terms.Any(
            term =>
                text.Contains(
                    term,
                    StringComparison.OrdinalIgnoreCase));
    }
    private static string NormalizeText(string value)
    {
        return Regex.Replace(
            value.ToLowerInvariant(),
            @"\s+",
            " ").Trim();
    }

    private static bool ContainsKeyword(
        string normalizedText,
        string keyword)
    {
        var normalizedKeyword =
            NormalizeText(keyword);

        if (string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            return false;
        }

        return Regex.IsMatch(
            normalizedText,
            $@"(?<![\w+#.]){Regex.Escape(normalizedKeyword)}(?![\w+#.])",
            RegexOptions.IgnoreCase);
    }


}

