using Backend.DTOs.Company;
using Backend.Interfaces.Repositories;
using Backend.Interfaces.Services;
using Backend.Models;

namespace Backend.Services.Companies
{
    public class CompanyService : ICompanyService
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly INotificationService _notificationService;

        public CompanyService(
            ICompanyRepository companyRepository,
            INotificationService notificationService)
        {
            _companyRepository = companyRepository;
            _notificationService = notificationService;
        }

        public async Task<CompanyResponseDto> CreateCompanyAsync(CreateCompanyDto dto, CancellationToken cancellationToken)
        {
            var existingCompany =
                await _companyRepository.GetCompanyByEmailAsync(dto.Email, cancellationToken);

            if (existingCompany != null)
                throw new Exception("Company email already exists.");

            var company = new Company
            {
                CompanyName = dto.CompanyName,
                Email = dto.Email,
                Phone = dto.Phone,
                Website = dto.Website,
                Industry = dto.Industry,
                Description = dto.Description,
                LogoUrl = dto.LogoUrl,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                Country = dto.Country,
                UserId = dto.UserId,
                IsActive = false,
                ApprovalStatus = "Pending"
            };

            await _companyRepository.AddCompanyAsync(company, cancellationToken);
            await _companyRepository.SaveChangesAsync(cancellationToken);
            await _notificationService.NotifyAdminsCompanyRegisteredAsync(
                company.UserId,
                company.CompanyName, cancellationToken);

            return new CompanyResponseDto
            {
                Id = company.Id,
                CompanyName = company.CompanyName,
                Email = company.Email,
                Phone = company.Phone,
                Website = company.Website,
                Industry = company.Industry,
                Description = company.Description,
                LogoUrl = company.LogoUrl,
                Address = company.Address,
                City = company.City,
                State = company.State,
                Country = company.Country,
                UserId = company.UserId,
                IsActive = company.IsActive,
                ApprovalStatus = company.ApprovalStatus,
                ApprovedAt = company.ApprovedAt,
                RejectionReason = company.RejectionReason,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }

        public async Task<IEnumerable<CompanyResponseDto>> GetAllCompaniesAsync(CancellationToken cancellationToken)
        {
            var companies =
                await _companyRepository.GetAllCompaniesAsync(cancellationToken);

            return companies.Select(c => new CompanyResponseDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                Email = c.Email,
                Phone = c.Phone,
                Website = c.Website,
                Industry = c.Industry,
                Description = c.Description,
                LogoUrl = c.LogoUrl,
                Address = c.Address,
                City = c.City,
                State = c.State,
                Country = c.Country,
                UserId = c.UserId,
                IsActive = c.IsActive,
                ApprovalStatus = c.ApprovalStatus,
                ApprovedAt = c.ApprovedAt,
                RejectionReason = c.RejectionReason,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
        }

        public async Task<CompanyResponseDto?> GetCompanyByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            var company =
                await _companyRepository.GetCompanyByIdAsync(id, cancellationToken);

            if (company == null)
                return null;

            return new CompanyResponseDto
            {
                Id = company.Id,
                CompanyName = company.CompanyName,
                Email = company.Email,
                Phone = company.Phone,
                Website = company.Website,
                Industry = company.Industry,
                Description = company.Description,
                LogoUrl = company.LogoUrl,
                Address = company.Address,
                City = company.City,
                State = company.State,
                Country = company.Country,
                UserId = company.UserId,
                IsActive = company.IsActive,
                ApprovalStatus = company.ApprovalStatus,
                ApprovedAt = company.ApprovedAt,
                RejectionReason = company.RejectionReason,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }

        public async Task<CompanyResponseDto?> GetCompanyByUserIdAsync(Guid userId, CancellationToken cancellationToken)
        {
            var company =
                await _companyRepository.GetCompanyByUserIdAsync(userId, cancellationToken);

            if (company == null)
                return null;

            return new CompanyResponseDto
            {
                Id = company.Id,
                CompanyName = company.CompanyName,
                Email = company.Email,
                Phone = company.Phone,
                Website = company.Website,
                Industry = company.Industry,
                Description = company.Description,
                LogoUrl = company.LogoUrl,
                Address = company.Address,
                City = company.City,
                State = company.State,
                Country = company.Country,
                UserId = company.UserId,
                IsActive = company.IsActive,
                ApprovalStatus = company.ApprovalStatus,
                ApprovedAt = company.ApprovedAt,
                RejectionReason = company.RejectionReason,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }

        public async Task<bool> UpdateCompanyAsync(Guid id, UpdateCompanyDto dto, CancellationToken cancellationToken)
        {
            var company =
                await _companyRepository.GetCompanyByIdAsync(id, cancellationToken);

            if (company == null)
                return false;

            company.CompanyName = dto.CompanyName;
            company.Email = dto.Email;
            company.Phone = dto.Phone;
            company.Website = dto.Website;
            company.Industry = dto.Industry;
            company.Description = dto.Description;
            company.LogoUrl = dto.LogoUrl;
            company.Address = dto.Address;
            company.City = dto.City;
            company.State = dto.State;
            company.Country = dto.Country;
            company.UpdatedAt = DateTime.UtcNow;

            await _companyRepository.UpdateCompanyAsync(company, cancellationToken);
            await _companyRepository.SaveChangesAsync(cancellationToken);

            return true;
        }

        public async Task<bool> DeleteCompanyAsync(Guid id, CancellationToken cancellationToken)
        {
            var company =
                await _companyRepository.GetCompanyByIdAsync(id, cancellationToken);

            if (company == null)
                return false;

            await _companyRepository.DeleteCompanyAsync(company, cancellationToken);
            await _companyRepository.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
