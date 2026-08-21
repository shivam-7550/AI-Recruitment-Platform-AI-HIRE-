using Backend.DTOs.Auth;

namespace Backend.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken);


    Task<AuthResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken);


    Task<AuthResponseDto> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken);


    Task RevokeRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken);
}