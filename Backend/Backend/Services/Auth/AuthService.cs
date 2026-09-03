using Backend.Constants;
using Backend.Data;
using Backend.DTOs.Auth;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Backend.Helpers;
using Backend.Interfaces.Auth;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
namespace Backend.Services.Auth;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ICompanyRepository _companyRepository;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher _passwordHasher;


    public AuthService(
        IUserRepository userRepository,
        IJwtTokenGenerator jwtTokenGenerator,
        ICompanyRepository companyRepository,
        INotificationService notificationService,
        ApplicationDbContext dbContext,
        IConfiguration configuration,
        IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _companyRepository = companyRepository;
        _notificationService = notificationService;
        _dbContext = dbContext;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
        
    }



    // ==========================================
    // REGISTER
    // ==========================================

    public async Task<AuthResponseDto> RegisterAsync(
    RegisterRequestDto request,
    CancellationToken cancellationToken)
    {
        // ==========================================
        // Validate Request
        // ==========================================

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return Failure(
                "Email and password are required.");
        }

        if (request.Password.Length < 8)
        {
            return Failure(
                "Password must contain minimum 8 characters.");
        }

        // ==========================================
        // Normalize Email
        // ==========================================

        var email =
            request.Email
                .Trim()
                .ToLowerInvariant();

        // ==========================================
        // Validate Role
        // ==========================================

        var role =
            Roles.All.FirstOrDefault(
                r =>
                    r.Equals(
                        request.Role.Trim(),
                        StringComparison.OrdinalIgnoreCase));

        if (role is not (Roles.User or Roles.Company))
        {
            return Failure(
                "Registration allowed only for Candidate or Company.");
        }

        // ==========================================
        // Check Existing User
        // ==========================================

        var existingUser =
            await _userRepository.GetByEmailAsync(
                email,
                cancellationToken);

        if (existingUser != null)
        {
            return Failure(
                "Email already exists.");
        }

        // ==========================================
        // SQL Server Execution Strategy
        // ==========================================

        var strategy =
            _dbContext.Database.CreateExecutionStrategy();

        AuthResponseDto? result = null;

        await strategy.ExecuteAsync(async () =>
        {
            // ======================================
            // Transaction
            // ======================================

            await using var transaction =
                await _dbContext.Database
                    .BeginTransactionAsync(
                        cancellationToken);

            try
            {
                // ==================================
                // Create User
                // ==================================

                var user = new User
                {
                    Id = Guid.NewGuid(),

                    Name = request.Name.Trim(),

                    Email = email,

                    PasswordHash =
                        _passwordHasher.HashPassword(
                            request.Password),

                    Role = role
                };

                await _userRepository.AddAsync(
                    user,
                    cancellationToken);

                await _userRepository.SaveChangesAsync(
                    cancellationToken);

                // ==================================
                // Create Company
                // ==================================

                if (role == Roles.Company)
                {
                    var company = new Company
                    {
                        Id = Guid.NewGuid(),

                        UserId = user.Id,

                        CompanyName = user.Name,

                        Email = user.Email,

                        IsActive = false,

                        ApprovalStatus = "Pending",

                        CreatedAt = DateTime.UtcNow
                    };

                    await _companyRepository.AddCompanyAsync(
                        company,
                        cancellationToken);

                    await _companyRepository.SaveChangesAsync(
                        cancellationToken);

                    // ==================================
                    // Notify Admins
                    // ==================================

                    await _notificationService
                        .NotifyAdminsCompanyRegisteredAsync(
                            user.Id,
                            company.CompanyName,
                            cancellationToken);
                }

                // ==================================
                // Commit Transaction
                // ==================================

                await transaction.CommitAsync(
                    cancellationToken);

                // ==================================
                // Response
                // ==================================

                result = new AuthResponseDto
                {
                    Success = true,

                    Message =
                        "Registration successful.",

                    Role = user.Role
                };
            }
            catch
            {
                await transaction.RollbackAsync(
                    cancellationToken);

                throw;
            }
        });

        return result!;
    }




    // ==========================================
    // LOGIN
    // ==========================================

    public async Task<AuthResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var email =
            request.Email
            .Trim()
            .ToLowerInvariant();



        var user =
            await _userRepository
            .GetUserWithCompanyAsync(email, cancellationToken);



        if (user == null)
        {
            return Failure(
                "Invalid email or password.");
        }



        var passwordValid =
    _passwordHasher.VerifyPassword(
        request.Password,
        user.PasswordHash);



        if (!passwordValid)
        {
            return Failure(
                "Invalid email or password.");
        }




        // Company approval check

        if (user.Role == Roles.Company)
        {
            if (user.Company == null ||
               user.Company.ApprovalStatus != "Approved")
            {
                return Failure(
                    "Company account is not approved yet.");
            }
        }



        var accessToken =
            _jwtTokenGenerator
            .GenerateToken(user);



        var refresh =
            CreateRefreshToken(user.Id);



        _dbContext.RefreshTokens
            .Add(refresh.StoredToken);



        await _dbContext.SaveChangesAsync(
            cancellationToken);



        return new AuthResponseDto
        {
            Success = true,

            Message =
            "Login successful.",

            Token = accessToken,

            RefreshToken =
                refresh.RawToken,


            RefreshTokenExpiresAt =
                refresh.StoredToken.ExpiresAt,


            TokenExpiresAt =
                _jwtTokenGenerator
                .GetAccessTokenExpiration(),


            UserId = user.Id,

            Name = user.Name,

            Email = user.Email,

            Role = user.Role
        };
    }



    // ==========================================
    // REFRESH TOKEN
    // ==========================================

    public async Task<AuthResponseDto> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        // ==========================================
        // Validate Input
        // ==========================================

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return InvalidRefreshToken();
        }

        cancellationToken.ThrowIfCancellationRequested();

        // ==========================================
        // Hash Refresh Token
        // ==========================================

        var hash = HashToken(refreshToken);

        // ==========================================
        // Find Stored Refresh Token
        // ==========================================

        var storedToken =
            await _dbContext.RefreshTokens
                .Include(x => x.User)
                .ThenInclude(x => x.Company)
                .FirstOrDefaultAsync(
                    x => x.TokenHash == hash,
                    cancellationToken);

        // ==========================================
        // Validate Stored Token
        // ==========================================

        if (storedToken is null || !storedToken.IsActive)
        {
            return InvalidRefreshToken();
        }

        // ==========================================
        // Revoke Current Refresh Token
        // ==========================================

        storedToken.RevokedAt = DateTime.UtcNow;

        // ==========================================
        // Create New Refresh Token
        // ==========================================

        var newToken = CreateRefreshToken(
            storedToken.UserId);

        // ==========================================
        // Link Old Token -> New Token
        // ==========================================

        storedToken.ReplacedByTokenHash =
            newToken.StoredToken.TokenHash;

        // ==========================================
        // Store New Refresh Token
        // ==========================================

        _dbContext.RefreshTokens.Add(
            newToken.StoredToken);

        // ==========================================
        // Save Changes
        // ==========================================

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        // ==========================================
        // Generate New Access Token
        // ==========================================

        var user = storedToken.User;

        var accessToken =
            _jwtTokenGenerator.GenerateToken(user);

        // ==========================================
        // Return Authentication Response
        // ==========================================

        return new AuthResponseDto
        {
            Success = true,

            Message = "Token refreshed.",

            Token = accessToken,

            RefreshToken = newToken.RawToken,

            RefreshTokenExpiresAt =
                newToken.StoredToken.ExpiresAt,

            TokenExpiresAt =
                _jwtTokenGenerator
                    .GetAccessTokenExpiration(),

            UserId = user.Id,

            Name = user.Name,

            Email = user.Email,

            Role = user.Role
        };
    }



    // ==========================================
    // LOGOUT
    // ==========================================

    public async Task RevokeRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;



        var hash =
            HashToken(refreshToken);



        var token =
            await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(
                x =>
                x.TokenHash == hash,
                cancellationToken);



        if (token != null &&
           token.RevokedAt == null)
        {
            token.RevokedAt =
                DateTime.UtcNow;


            await _dbContext.SaveChangesAsync(
                cancellationToken);
        }
    }




    // ==========================================
    // HELPERS
    // ==========================================

    private (string RawToken, RefreshToken StoredToken)
        CreateRefreshToken(Guid userId)
    {
        var rawToken =
            Convert.ToBase64String(
                RandomNumberGenerator
                .GetBytes(64));


        var days =
            Convert.ToDouble(
                _configuration
                ["Jwt:RefreshTokenDurationInDays"]
                ?? "7");



        return
        (
            rawToken,

            new RefreshToken
            {
                UserId = userId,

                TokenHash =
                    HashToken(rawToken),

                ExpiresAt =
                    DateTime.UtcNow
                    .AddDays(days)
            }
        );
    }



    private static string HashToken(
        string token)
    {
        return Convert.ToHexString(
            SHA256.HashData(
                Encoding.UTF8
                .GetBytes(token)));
    }



    private static AuthResponseDto Failure(
        string message)
    {
        return new AuthResponseDto
        {
            Success = false,

            Message = message
        };
    }



    private static AuthResponseDto InvalidRefreshToken()
    {
        return Failure(
            "Refresh token is invalid or expired.");
    }
}
