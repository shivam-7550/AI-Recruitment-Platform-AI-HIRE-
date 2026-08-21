using Backend.DTOs.Company;

namespace Backend.Interfaces;

public interface ICompanyService
{
    Task<CompanyResponseDto> CreateCompanyAsync(
        CreateCompanyDto dto,
        CancellationToken cancellationToken);


    Task<IEnumerable<CompanyResponseDto>> GetAllCompaniesAsync(
        CancellationToken cancellationToken);


    Task<CompanyResponseDto?> GetCompanyByIdAsync(
        Guid id,
        CancellationToken cancellationToken);


    Task<CompanyResponseDto?> GetCompanyByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);


    Task<bool> UpdateCompanyAsync(
        Guid id,
        UpdateCompanyDto dto,
        CancellationToken cancellationToken);


    Task<bool> DeleteCompanyAsync(
        Guid id,
        CancellationToken cancellationToken);
}