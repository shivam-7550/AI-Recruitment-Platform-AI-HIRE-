using Backend.Interfaces.Auth;
using Backend.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Helpers;

public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;


    public JwtTokenGenerator(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }



    public string GenerateToken(User user)
    {
        var jwtKey =
            _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "JWT Key is missing");



        var expiryMinutes =
            Convert.ToDouble(
                _configuration["Jwt:DurationInMinutes"]
                ?? "60");



        var key =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));



        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);



        var claims =
            new List<Claim>
            {
                new(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()),


                new(
                    ClaimTypes.Name,
                    user.Name),


                new(
                    ClaimTypes.Email,
                    user.Email),


                new(
                    ClaimTypes.Role,
                    user.Role)
            };



        if (user.Company != null)
        {
            claims.Add(
                new Claim(
                    "CompanyId",
                    user.Company.Id.ToString()));
        }



        var token =
            new JwtSecurityToken(

                issuer:
                _configuration["Jwt:Issuer"],


                audience:
                _configuration["Jwt:Audience"],


                claims:
                claims,


                expires:
                DateTime.UtcNow
                .AddMinutes(expiryMinutes),


                signingCredentials:
                credentials
            );



        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }




    public DateTime GetAccessTokenExpiration()
    {
        var expiryMinutes =
            Convert.ToDouble(
                _configuration["Jwt:DurationInMinutes"]
                ?? "60");


        return DateTime.UtcNow
            .AddMinutes(expiryMinutes);
    }
}
