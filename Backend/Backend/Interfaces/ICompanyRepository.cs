using Backend.Models;

namespace Backend.Interfaces;

public interface ICompanyRepository
{
    Task<IEnumerable<Company>> GetAllCompaniesAsync(
        CancellationToken cancellationToken);


    Task<Company?> GetCompanyByIdAsync(
        Guid id,
        CancellationToken cancellationToken);


    Task<Company?> GetCompanyByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);


    Task<Company?> GetCompanyByEmailAsync(
        string email,
        CancellationToken cancellationToken);


    Task AddCompanyAsync(
        Company company,
        CancellationToken cancellationToken);


    Task UpdateCompanyAsync(
        Company company,
        CancellationToken cancellationToken);


    Task DeleteCompanyAsync(
        Company company,
        CancellationToken cancellationToken);


    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}