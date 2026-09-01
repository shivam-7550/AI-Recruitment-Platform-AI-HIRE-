using Backend.DTOs.Resume;

namespace Backend.Interfaces.Services;

public interface IResumeAIService
{
    Task<ResumeAIAnalysisDto>
        AnalyzeResumeAsync(
            string resumeText,
            string skills);

    Task<ResumeAIAnalysisDto>
        AnalyzeResumeForJobAsync(
            string resumeText,
            string skills,
            string jobTitle,
            string jobDescription,
            string jobSkills,
            int requiredExperience);
    Task<CompanyCandidateAIAnalysisDto>
        AnalyzeCandidateForCompanyAsync(
            string resumeText,
            string candidateSkills,
            string jobTitle,
            string jobDescription,
            string jobSkills,
            CancellationToken cancellationToken);

}