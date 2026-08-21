using Backend.Models;

namespace Backend.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);

    DateTime GetAccessTokenExpiration();
}