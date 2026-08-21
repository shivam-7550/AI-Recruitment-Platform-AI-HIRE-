using Backend.Data;
using Backend.DTOs.UserProfile;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public sealed class UserProfileService : IUserProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public UserProfileService(
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // =========================================================
    // GET PROFILE
    // =========================================================

    public async Task<UserProfileDto?> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken);

        if (user == null)
            return null;

        var profile = await _context.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        return Map(user, profile);
    }

    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    public async Task<UserProfileDto?> UpdateProfileAsync(
        Guid userId,
        UserProfileDto dto,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken);

        if (user == null)
            return null;

        var profile = await _context.UserProfiles
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            user.Name = dto.Name.Trim();
        }

        user.UpdatedAt = DateTime.UtcNow;

        if (profile == null)
        {
            profile = new UserProfile
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };

            _context.UserProfiles.Add(profile);
        }

        Apply(profile, dto);

        await _context.SaveChangesAsync(cancellationToken);

        return Map(user, profile);
    }

    // =========================================================
    // UPLOAD PROFILE PHOTO
    // =========================================================

    public async Task<string> UploadPhotoAsync(
        Guid userId,
        IFormFile photo,
        CancellationToken cancellationToken)
    {
        if (photo == null || photo.Length == 0)
        {
            throw new ArgumentException("Photo is required.");
        }

        const long maxFileSize = 2 * 1024 * 1024;

        if (photo.Length > maxFileSize)
        {
            throw new ArgumentException(
                "Photo must be 2 MB or smaller.");
        }

        var extension = Path
            .GetExtension(photo.FileName)
            .ToLowerInvariant();

        var allowedExtensions = new[]
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Only JPG, JPEG, PNG, and WEBP photos are allowed.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException(
                "User not found.");
        }

        var profile = await _context.UserProfiles
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken);

        var webRoot = _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot");
        }

        var folder = Path.Combine(
            webRoot,
            "profile-images");

        Directory.CreateDirectory(folder);

        var oldPhotoUrl = profile?.PhotoUrl;

        var fileName =
            $"{user.Id}-{Guid.NewGuid():N}{extension}";

        var filePath = Path.Combine(
            folder,
            fileName);

        await using (var stream = new FileStream(
            filePath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            81920,
            useAsync: true))
        {
            await photo.CopyToAsync(
                stream,
                cancellationToken);
        }

        if (profile == null)
        {
            profile = new UserProfile
            {
                UserId = userId
            };

            _context.UserProfiles.Add(profile);
        }

        profile.PhotoUrl =
            $"/profile-images/{fileName}";

        profile.UpdatedAt =
            DateTime.UtcNow;

        user.UpdatedAt =
            DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync(
                cancellationToken);
        }
        catch
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            throw;
        }

        if (!string.IsNullOrWhiteSpace(oldPhotoUrl))
        {
            DeleteOldPhoto(oldPhotoUrl);
        }

        return profile.PhotoUrl;
    }

    // =========================================================
    // APPLY PROFILE DATA
    // =========================================================

    private static void Apply(
        UserProfile target,
        UserProfileDto source)
    {
        target.Phone = source.Phone;
        target.DateOfBirth = source.DateOfBirth;
        target.Bio = source.Bio;

        target.Address = source.Address;
        target.City = source.City;
        target.Country = source.Country;

        target.Degree = source.Degree;
        target.FieldOfStudy = source.FieldOfStudy;
        target.Institution = source.Institution;
        target.GraduationYear = source.GraduationYear;

        target.ProfessionalHeadline =
            source.ProfessionalHeadline;

        target.ExperienceYears =
            source.ExperienceYears;

        target.CurrentCompany =
            source.CurrentCompany;

        target.CurrentJobTitle = source.CurrentJobTitle;
        target.PreferredJobTitle = source.PreferredJobTitle;
        target.EmploymentType = source.EmploymentType;
        target.PreferredLocation = source.PreferredLocation;
        target.WorkMode = source.WorkMode;
        target.ExpectedSalary = source.ExpectedSalary;

        target.Skills =
            source.Skills;

        target.Languages =
            source.Languages;

        target.InternshipDetails =
            source.InternshipDetails;

        target.LinkedInUrl =
            source.LinkedInUrl;

        target.PortfolioUrl =
            source.PortfolioUrl;

        target.GithubUrl = source.GithubUrl;

        target.UpdatedAt =
            DateTime.UtcNow;
    }

    // =========================================================
    // MAP ENTITY → DTO
    // =========================================================

    private static UserProfileDto Map(
        User user,
        UserProfile? profile)
    {
        return new UserProfileDto
        {
            Name = user.Name,
            Email = user.Email,

            Phone = profile?.Phone,
            DateOfBirth = profile?.DateOfBirth,
            Bio = profile?.Bio,

            Address = profile?.Address,
            City = profile?.City,
            Country = profile?.Country,

            PhotoUrl = profile?.PhotoUrl,

            Degree = profile?.Degree,
            FieldOfStudy = profile?.FieldOfStudy,
            Institution = profile?.Institution,
            GraduationYear = profile?.GraduationYear,

            ProfessionalHeadline =
                profile?.ProfessionalHeadline,

            ExperienceYears =
                profile?.ExperienceYears,

            CurrentCompany =
                profile?.CurrentCompany,

            CurrentJobTitle = profile?.CurrentJobTitle,
            PreferredJobTitle = profile?.PreferredJobTitle,
            EmploymentType = profile?.EmploymentType,
            PreferredLocation = profile?.PreferredLocation,
            WorkMode = profile?.WorkMode,
            ExpectedSalary = profile?.ExpectedSalary,

            Skills =
                profile?.Skills,

            Languages =
                profile?.Languages,

            InternshipDetails =
                profile?.InternshipDetails,

            LinkedInUrl =
                profile?.LinkedInUrl,

            PortfolioUrl =
                profile?.PortfolioUrl,

            GithubUrl = profile?.GithubUrl
        };
    }

    // =========================================================
    // DELETE OLD PHOTO
    // =========================================================

    private void DeleteOldPhoto(string photoUrl)
    {
        var fileName = Path.GetFileName(photoUrl);

        if (string.IsNullOrWhiteSpace(fileName))
            return;

        var webRoot = _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot");
        }

        var path = Path.Combine(
            webRoot,
            "profile-images",
            fileName);

        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }
}
