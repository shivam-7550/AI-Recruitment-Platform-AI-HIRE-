using Backend.Data;
using Backend.Interfaces.Repositories;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public sealed class CompanyRepository : ICompanyRepository
{
    private readonly ApplicationDbContext _context;


    public CompanyRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }




    public async Task<IEnumerable<Company>> GetAllCompaniesAsync(
        CancellationToken cancellationToken)
    {
        return await _context.Companies
            .Include(c => c.User)
            .OrderBy(c => c.CompanyName)
            .ToListAsync(cancellationToken);
    }




    public async Task<Company?> GetCompanyByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _context.Companies
            .Include(c => c.User)
            .FirstOrDefaultAsync(
                c => c.Id == id,
                cancellationToken);
    }




    public async Task<Company?> GetCompanyByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Companies
            .Include(c => c.User)
            .FirstOrDefaultAsync(
                c => c.UserId == userId,
                cancellationToken);
    }




    public async Task<Company?> GetCompanyByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await _context.Companies
            .FirstOrDefaultAsync(
                c => c.Email == email,
                cancellationToken);
    }




    public async Task AddCompanyAsync(
        Company company,
        CancellationToken cancellationToken)
    {
        await _context.Companies
            .AddAsync(
                company,
                cancellationToken);
    }




    public Task UpdateCompanyAsync(
        Company company,
        CancellationToken cancellationToken)
    {
        _context.Companies.Update(company);

        return Task.CompletedTask;
    }




    public Task DeleteCompanyAsync(
        Company company,
        CancellationToken cancellationToken)
    {
        _context.Companies.Remove(company);

        return Task.CompletedTask;
    }




    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}