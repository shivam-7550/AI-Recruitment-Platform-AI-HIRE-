namespace Backend.DTOs.Application;

public sealed class ApplicationResultDto
{
    public bool Success { get; set; }


    public string Message { get; set; } = string.Empty;


    public Guid? ApplicationId { get; set; }


    public double ATSScore { get; set; }
}