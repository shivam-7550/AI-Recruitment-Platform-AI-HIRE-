using Backend.DTOs.Resume;

namespace Backend.Interfaces.Services;

public interface IResumeAIService
{
    // =====================================================
    // GENERAL RESUME AI ANALYSIS
    // =====================================================

    Task<ResumeAIAnalysisDto> AnalyzeResumeAsync(
        string resumeText,
        string skills,
        CancellationToken cancellationToken = default);

    Task<ResumeParsedDataDto> ExtractResumeDataAsync(
        string resumeText,
        CancellationToken cancellationToken);


    // =====================================================
    // JOB-SPECIFIC AI ANALYSIS
    // =====================================================

    Task<ResumeAIAnalysisDto> AnalyzeResumeForJobAsync(
        string resumeText,
        string skills,
        string jobTitle,
        string jobDescription,
        string jobSkills,
        string preferredSkills,
        string educationRequirements,
        string certificationRequirements,
        int requiredExperience,
        CancellationToken cancellationToken = default);


    // =====================================================
    // COMPANY PORTAL - CANDIDATE AI ANALYSIS
    // =====================================================

    Task<CompanyCandidateAIAnalysisDto> AnalyzeCandidateForCompanyAsync(
        string resumeText,
        string candidateSkills,
        string jobTitle,
        string jobDescription,
        string jobSkills,
        CancellationToken cancellationToken = default);
}