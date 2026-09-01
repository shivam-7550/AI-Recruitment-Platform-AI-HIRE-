using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Interview;

public class UpdateInterviewStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}