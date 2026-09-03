using Backend.DTOs.Resume;
using Backend.Models;

namespace Backend.Interfaces.ATS;

public interface IATSService
{
    // Candidate Resume Quality Score
    double CalculateResumeScore(
        Resume resume);

    // Basic Skill Match Score
    double CalculateJobMatchScore(
        Resume resume,
        Job job);

    // Advanced ATS Breakdown
    ATSBreakdownDto CalculateAdvancedATS(
        Resume resume,
        Job job);
}