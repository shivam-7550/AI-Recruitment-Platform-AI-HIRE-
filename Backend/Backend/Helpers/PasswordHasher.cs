

namespace Backend.Helpers;

public sealed class PasswordHasher
{
    public string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException(
                "Password cannot be empty.",
                nameof(password));

        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(
        string password,
        string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(
            password,
            passwordHash);
    }
}
