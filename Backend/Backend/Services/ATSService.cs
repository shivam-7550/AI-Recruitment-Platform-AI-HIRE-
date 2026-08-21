using Backend.Interfaces;
using Backend.Models;
using System.Text.RegularExpressions;

namespace Backend.Services;

public sealed class ATSService : IATSService
{
    // =========================================================
    // GENERAL RESUME ATS SCORE
    // =========================================================

    public double CalculateResumeScore(Resume resume)
    {
        if (resume == null)
            return 0;

        var text = resume.ResumeText ?? string.Empty;

        if (string.IsNullOrWhiteSpace(text))
            return 0;

        double score = 0;

        // -------------------------
        // Contact Details - 15
        // -------------------------

        var hasEmail =
            !string.IsNullOrWhiteSpace(resume.Email) ||
            Regex.IsMatch(
                text,
                @"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b");

        var hasPhone =
            !string.IsNullOrWhiteSpace(resume.PhoneNumber) ||
            Regex.IsMatch(
                text,
                @"(?:\+?\d[\d\s-]{8,}\d)");

        if (hasEmail)
            score += 8;

        if (hasPhone)
            score += 7;

        // -------------------------
        // Skills - 30
        // -------------------------

        var skills = SplitSkills(resume.ExtractedSkills);

        score += Math.Min(
            skills.Count * 5,
            30);

        // -------------------------
        // Experience - 20
        // -------------------------

        if (resume.Experience > 0)
        {
            score += 20;
        }
        else if (HasAny(
            text,
            "experience",
            "work experience",
            "internship",
            "employment"))
        {
            score += 15;
        }

        // -------------------------
        // Education - 15
        // -------------------------

        if (!string.IsNullOrWhiteSpace(resume.Education) ||
            HasAny(
                text,
                "education",
                "academic qualification",
                "b.tech",
                "bachelor",
                "master",
                "degree",
                "university",
                "college"))
        {
            score += 15;
        }

        // -------------------------
        // Projects - 10
        // -------------------------

        if (HasAny(
            text,
            "project",
            "projects",
            "academic project",
            "personal project"))
        {
            score += 10;
        }

        // -------------------------
        // Certifications - 5
        // -------------------------

        if (HasAny(
            text,
            "certification",
            "certifications",
            "certificate",
            "certified"))
        {
            score += 5;
        }

        // -------------------------
        // Formatting - 5
        // -------------------------

        score += FormattingQuality(
            text,
            resume) * 5;

        return Math.Round(
            Math.Clamp(score, 0, 100),
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
            return 0;

        var text =
            resume.ResumeText ?? string.Empty;

        var score =
            SkillCoverage(
                resume.ExtractedSkills,
                job.Skills) * 40

            +

            ExperienceCoverage(
                resume,
                text,
                job.Experience) * 20

            +

            (HasAny(
                text,
                "projects",
                "project experience",
                "academic project",
                "personal project")
                ? 15
                : 0)

            +

            (!string.IsNullOrWhiteSpace(resume.Education) ||
             HasAny(
                 text,
                 "education",
                 "academic qualification",
                 "b.tech",
                 "bachelor",
                 "master",
                 "degree",
                 "university",
                 "college")
                ? 10
                : 0)

            +

            (HasAny(
                text,
                "certification",
                "certifications",
                "certified",
                "certificate")
                ? 5
                : 0)

            +

            FormattingQuality(
                text,
                resume) * 5

            +

            KeywordDensity(
                text,
                job.Skills) * 5;

        return Math.Round(
            Math.Clamp(score, 0, 100),
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
}