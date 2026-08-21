using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Resume
{
    public class UploadResumeDto
    {
        [Required]
        public IFormFile Resume { get; set; } = null!;
    }
}