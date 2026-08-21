using Backend.Models;

namespace Backend.Interfaces;

public interface IATSService
{
    // General resume ATS score
    double CalculateResumeScore(Resume resume);

    // Resume vs specific job matching score
    double CalculateJobMatchScore(
        Resume resume,
        Job job);
}