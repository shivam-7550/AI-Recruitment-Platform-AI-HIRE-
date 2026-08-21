namespace Backend.DTOs.Auth
{
    public class AuthResponseDto
    {
        public bool Success { get; set; }

        public string Message { get; set; } = string.Empty;


        public string? Token { get; set; }

        public string? RefreshToken { get; set; }


        public Guid UserId { get; set; }

        public string Role { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;


        public DateTime? TokenExpiresAt { get; set; }

        public DateTime? RefreshTokenExpiresAt { get; set; }
    }
}
