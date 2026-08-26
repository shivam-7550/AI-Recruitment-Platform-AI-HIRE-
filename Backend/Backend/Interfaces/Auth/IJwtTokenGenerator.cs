using Backend.Models;

namespace Backend.Interfaces.Auth;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);

    DateTime GetAccessTokenExpiration();
}
