using Backend.Data;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;


    public UserRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }



    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Email == email,
                cancellationToken);
    }




    public async Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Id == id,
                cancellationToken);
    }




    public async Task<User?> GetUserWithCompanyAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await _context.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(
                u => u.Email == email,
                cancellationToken);
    }




    public async Task AddAsync(
        User user,
        CancellationToken cancellationToken)
    {
        await _context.Users
            .AddAsync(
                user,
                cancellationToken);
    }




    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}