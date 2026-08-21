using Backend.DTOs.Auth;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;


    public AuthController(
        IAuthService authService)
    {
        _authService = authService;
    }



    [HttpPost("register")]
    public async Task<IActionResult> Register(
    RegisterRequestDto request,
    CancellationToken cancellationToken)
    {
        var response =
            await _authService.RegisterAsync(
                request,
                cancellationToken);

        if (!response.Success)
            return BadRequest(response);

        return Ok(response);
    }




    [HttpPost("login")]
    public async Task<IActionResult> Login(
    LoginRequestDto request,
    CancellationToken cancellationToken)
    {
        var response =
            await _authService.LoginAsync(
                request,
                cancellationToken);


        if (!response.Success)
            return Unauthorized(response);


        SetRefreshTokenCookie(response);

        return Ok(response);
    }





    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
    CancellationToken cancellationToken)
    {
        var token =
            Request.Cookies["refreshToken"]
            ?? string.Empty;


        var response =
            await _authService.RefreshAsync(
                token,
                cancellationToken);


        if (!response.Success)
        {
            Response.Cookies.Delete(
                "refreshToken");

            return Unauthorized(response);
        }


        SetRefreshTokenCookie(response);

        return Ok(response);
    }





    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            Id =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier),


            Name =
            User.FindFirst("Name")?.Value,


            Email =
            User.FindFirstValue(
                ClaimTypes.Email),


            Role =
            User.FindFirstValue(
                ClaimTypes.Role)
        });
    }





    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
    CancellationToken cancellationToken)
    {
        await _authService.RevokeRefreshTokenAsync(
            Request.Cookies["refreshToken"]
            ?? string.Empty,
            cancellationToken);


        Response.Cookies.Delete(
            "refreshToken");


        return NoContent();
    }




    private void SetRefreshTokenCookie(
        AuthResponseDto response)
    {
        if (string.IsNullOrWhiteSpace(response.RefreshToken)
           ||
           response.RefreshTokenExpiresAt == null)
        {
            return;
        }



        Response.Cookies.Append(
            "refreshToken",
            response.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,

                Secure = true,

                SameSite =
                    SameSiteMode.Strict,

                Expires =
                    response.RefreshTokenExpiresAt,

                Path = "/"
            });
    }
}