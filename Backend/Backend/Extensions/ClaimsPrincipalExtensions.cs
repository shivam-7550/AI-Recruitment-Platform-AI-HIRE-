using System.Security.Claims;

namespace Backend.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(
        this ClaimsPrincipal user)
    {
        var value =
            user.FindFirst(
                ClaimTypes.NameIdentifier)
            ?.Value;


        if (!Guid.TryParse(
                value,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Invalid user token.");
        }


        return userId;
    }
}