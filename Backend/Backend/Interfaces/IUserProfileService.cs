using Backend.DTOs.UserProfile;

namespace Backend.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<UserProfileDto?> UpdateProfileAsync(
        Guid userId,
        UserProfileDto dto,
        CancellationToken cancellationToken);

    Task<string> UploadPhotoAsync(
        Guid userId,
        IFormFile photo,
        CancellationToken cancellationToken);
}