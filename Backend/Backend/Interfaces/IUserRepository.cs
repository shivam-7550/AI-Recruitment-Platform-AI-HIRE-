using Backend.Models;

namespace Backend.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken);


    Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);


    Task<User?> GetUserWithCompanyAsync(
        string email,
        CancellationToken cancellationToken);


    Task AddAsync(
        User user,
        CancellationToken cancellationToken);


    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}