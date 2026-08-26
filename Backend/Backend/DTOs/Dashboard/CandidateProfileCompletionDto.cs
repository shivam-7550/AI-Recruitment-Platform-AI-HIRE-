namespace Backend.DTOs.Dashboard
{
    public class CandidateProfileCompletionDto
    {
        public int Total { get; set; }

        public Dictionary<string, int> Breakdown { get; set; } = new();
    }
}
