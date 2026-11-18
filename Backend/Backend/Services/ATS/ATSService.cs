using Backend.Interfaces.ATS;
using Backend.Models;
using System.Text.RegularExpressions;
using Backend.DTOs.Resume;
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
        // Deterministic resume-readiness score. Job-specific matching is
        // handled separately by CalculateJobMatchScore.
        var text = resume.ResumeText;
        var normalized = NormalizeText(text);
        var score = 0d;
        var skills = SplitSkills(resume.ExtractedSkills);
        score += Math.Min(20, skills.Count * 2.5);

        if (Regex.IsMatch(normalized, @"\b(experience|employment|work history)\b"))
            score += 18;
        else if (Regex.IsMatch(normalized, @"\b(developed|managed|designed|led|built)\b"))
            score += 10;

        if (Regex.IsMatch(normalized, @"\b\d+\s*(%|percent|users|customers|years|months|projects|clients)\b"))
            score += 12;
        else if (Regex.IsMatch(normalized, @"\b(achieved|improved|reduced|increased|delivered)\b"))
            score += 5;

        if (Regex.IsMatch(normalized, @"\b(education|university|college|bachelor|master|degree)\b"))
            score += 10;
        if (Regex.IsMatch(normalized, @"\b(projects?|portfolio)\b"))
            score += 10;
        if (Regex.IsMatch(normalized, @"\b(summary|profile|objective)\b"))
            score += 10;
        if (Regex.IsMatch(normalized, @"\b(certifications?|certified|license)\b"))
            score += 5;

        var sectionCount = Regex.Matches(
            normalized,
            @"\b(experience|employment|education|skills|projects?|certifications?|summary|profile)\b")
            .Count;
        score += Math.Min(15, sectionCount * 2.5);
        if (text.Length >= 700)
            score += 5;

        return Math.Round(Math.Min(100, score), 2);
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
    public ATSBreakdownDto CalculateAdvancedATS(
    Resume resume,
    Job job)
    {
        if (resume == null || job == null)
        {
            return new ATSBreakdownDto();
        }
        var skillsMatch =
            CalculateSkillsMatch(
                resume.ExtractedSkills,
                job.Skills);
        var experienceMatch =
            CalculateExperienceMatch(
                resume.ExperienceYears,
                job.Experience);
        var educationMatch =
            CalculateEducationMatch(
                resume.EducationDetails,
                job.EducationRequirements);
        var projectMatch =
            CalculateProjectMatch(
                resume.Projects,
                job.Description);
        var certificationMatch =
            CalculateCertificationMatch(
                resume.Certifications,
                job.CertificationRequirements);
        var summaryMatch =
            CalculateSummaryMatch(
                resume.ProfessionalSummary);
        var structureMatch =
            CalculateStructureMatch(
                resume);
        var jobDescriptionMatch =
            CalculateJobDescriptionMatch(
                resume.ResumeText,
                job.Description);
        var finalScore =
            (
                skillsMatch * 0.30 +
                experienceMatch * 0.20 +
                educationMatch * 0.10 +
                projectMatch * 0.15 +
                certificationMatch * 0.10 +
                summaryMatch * 0.05 +
                structureMatch * 0.05 +
                jobDescriptionMatch * 0.05
            );
        return new ATSBreakdownDto
        {
            ATSScore =
                Math.Round(finalScore, 2),
            SkillsMatch =
                Math.Round(skillsMatch, 2),
            ExperienceMatch =
                Math.Round(experienceMatch, 2),
            EducationMatch =
                Math.Round(educationMatch, 2),
            ProjectMatch =
                Math.Round(projectMatch, 2),
            CertificationMatch =
                Math.Round(certificationMatch, 2),
            SummaryMatch =
                Math.Round(summaryMatch, 2),
            StructureMatch =
                Math.Round(structureMatch, 2),
            JobDescriptionMatch =
                Math.Round(jobDescriptionMatch, 2)
        };
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
    private static string NormalizeText(
    string value)
    {
        return Regex.Replace(
            value.ToLowerInvariant(),
            @"\s+",
            " ")
            .Trim();
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
    private static double CalculateSkillsMatch(
    string? resumeSkills,
    string? jobSkills)
    {
        var resume =
            SplitSkills(resumeSkills);
        var required =
            SplitSkills(jobSkills);
        if (required.Count == 0)
        {
            return 0;
        }
        var matched =
            required.Count(
                resume.Contains);
        return Math.Round(
            (double)matched /
            required.Count * 100,
            2);
    }
    private static double CalculateExperienceMatch(
    int candidateYears,
    int requiredYears)
    {
        if (requiredYears <= 0)
        {
            return 100;
        }
        return Math.Min(
            100,
            (double)candidateYears /
            requiredYears * 100);
    }
    private static double CalculateEducationMatch(
    string? education,
    string? requirements)
    {
        if (string.IsNullOrWhiteSpace(requirements))
        {
            return 100;
        }
        if (string.IsNullOrWhiteSpace(education))
        {
            return 0;
        }
        return education.Contains(
            requirements,
            StringComparison.OrdinalIgnoreCase)
                ? 100
                : 50;
    }
    private static double CalculateProjectMatch(
    string? projects,
    string? description)
    {
        if (string.IsNullOrWhiteSpace(projects))
        {
            return 0;
        }
        if (string.IsNullOrWhiteSpace(description))
        {
            return 50;
        }
        var matches =
            projects.Split(
                    ',',
                    StringSplitOptions.RemoveEmptyEntries)
                .Count(project =>
                    description.Contains(
                        project.Trim(),
                        StringComparison.OrdinalIgnoreCase));
        return Math.Min(
            100,
            matches * 25);
    }
    private static double CalculateCertificationMatch(
    string? certifications,
    string? requirements)
    {
        if (string.IsNullOrWhiteSpace(requirements))
        {
            return 100;
        }
        if (string.IsNullOrWhiteSpace(certifications))
        {
            return 0;
        }
        return certifications.Contains(
            requirements,
            StringComparison.OrdinalIgnoreCase)
                ? 100
                : 0;
    }
    private static double CalculateSummaryMatch(
    string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary))
        {
            return 0;
        }
        return summary.Length switch
        {
            >= 300 => 100,
            >= 150 => 80,
            >= 75 => 60,
            _ => 30
        };
    }
    private static double CalculateStructureMatch(
    Resume resume)
    {
        var score = 0;
        if (!string.IsNullOrWhiteSpace(
                resume.ProfessionalSummary))
        {
            score += 20;
        }
        if (!string.IsNullOrWhiteSpace(
                resume.EducationDetails))
        {
            score += 20;
        }
        if (!string.IsNullOrWhiteSpace(
                resume.Projects))
        {
            score += 20;
        }
        if (!string.IsNullOrWhiteSpace(
                resume.Certifications))
        {
            score += 20;
        }
        if (!string.IsNullOrWhiteSpace(
                resume.ExtractedSkills))
        {
            score += 20;
        }
        return score;
    }
    private static double CalculateJobDescriptionMatch(
    string resumeText,
    string description)
    {
        if (string.IsNullOrWhiteSpace(resumeText) ||
            string.IsNullOrWhiteSpace(description))
        {
            return 0;
        }
        var words =
            description.Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries);
        var matched =
            words.Count(word =>
                resumeText.Contains(
                    word,
                    StringComparison.OrdinalIgnoreCase));
        return Math.Round(
            (double)matched /
            words.Length * 100,
            2);
    }
}
