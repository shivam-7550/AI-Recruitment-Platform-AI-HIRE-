using Backend.DTOs.Company;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class AdminController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ICompanyRepository _companyRepository;
    private readonly INotificationService _notificationService;

    public AdminController(
        ICompanyService companyService,
        ICompanyRepository companyRepository,
        INotificationService notificationService)
    {
        _companyService = companyService;
        _companyRepository = companyRepository;
        _notificationService = notificationService;
    }

    // =========================================================
    // Get All Companies
    // GET: api/Admin/companies
    // =========================================================

    [HttpGet("companies")]
    public async Task<IActionResult> GetAllCompanies(
        CancellationToken cancellationToken)
    {
        var companies =
            await _companyService.GetAllCompaniesAsync(
                cancellationToken);

        return Ok(companies);
    }

    // =========================================================
    // Get Company By Id
    // GET: api/Admin/companies/{id}
    // =========================================================

    [HttpGet("companies/{id:guid}")]
    public async Task<IActionResult> GetCompanyById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyService.GetCompanyByIdAsync(
                id,
                cancellationToken);

        if (company == null)
        {
            return NotFound(new
            {
                Success = false,
                Message = "Company not found."
            });
        }

        return Ok(company);
    }

    // =========================================================
    // Approve Company
    // PUT: api/Admin/companies/{id}/approve
    // =========================================================

    [HttpPut("companies/{id:guid}/approve")]
    public async Task<IActionResult> ApproveCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyRepository.GetCompanyByIdAsync(
                id,
                cancellationToken);

        if (company == null)
        {
            return NotFound(new
            {
                Success = false,
                Message = "Company not found."
            });
        }

        if (company.ApprovalStatus.Equals(
                "Approved",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                Success = false,
                Message = "Company is already approved."
            });
        }

        var adminClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        Guid? adminId = null;

        if (Guid.TryParse(
                adminClaim,
                out var parsedAdminId))
        {
            adminId = parsedAdminId;
        }

        company.ApprovalStatus = "Approved";
        company.IsActive = true;
        company.ApprovedAt = DateTime.UtcNow;
        company.ApprovedByAdminId = adminId;
        company.RejectionReason = null;
        company.UpdatedAt = DateTime.UtcNow;

        await _companyRepository.UpdateCompanyAsync(
            company,
            cancellationToken);

        await _companyRepository.SaveChangesAsync(
            cancellationToken);

        await _notificationService.NotifyCompanyApprovalAsync(
            company.UserId,
            company.CompanyName,
            "Approved",
            null,
            cancellationToken);

        return Ok(new
        {
            Success = true,
            Message = "Company approved successfully."
        });
    }

    // =========================================================
    // Reject Company
    // PUT: api/Admin/companies/{id}/reject
    // =========================================================

    [HttpPut("companies/{id:guid}/reject")]
    public async Task<IActionResult> RejectCompany(
        Guid id,
        [FromBody] CompanyRejectionRequest request,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyRepository.GetCompanyByIdAsync(
                id,
                cancellationToken);

        if (company == null)
        {
            return NotFound(new
            {
                Success = false,
                Message = "Company not found."
            });
        }

        if (company.ApprovalStatus.Equals(
                "Rejected",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                Success = false,
                Message = "Company is already rejected."
            });
        }

        var rejectionReason =
            string.IsNullOrWhiteSpace(request?.Reason)
                ? "Company verification was not approved."
                : request.Reason.Trim();

        company.ApprovalStatus = "Rejected";
        company.IsActive = false;
        company.ApprovedAt = null;
        company.ApprovedByAdminId = null;
        company.RejectionReason = rejectionReason;
        company.UpdatedAt = DateTime.UtcNow;

        await _companyRepository.UpdateCompanyAsync(
            company,
            cancellationToken);

        await _companyRepository.SaveChangesAsync(
            cancellationToken);

        await _notificationService.NotifyCompanyApprovalAsync(
            company.UserId,
            company.CompanyName,
            "Rejected",
            company.RejectionReason,
            cancellationToken);

        return Ok(new
        {
            Success = true,
            Message = "Company rejected successfully."
        });
    }

    // =========================================================
    // Delete Company
    // DELETE: api/Admin/companies/{id}
    // =========================================================

    [HttpDelete("companies/{id:guid}")]
    public async Task<IActionResult> DeleteCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted =
            await _companyService.DeleteCompanyAsync(
                id,
                cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                Success = false,
                Message = "Company not found."
            });
        }

        return Ok(new
        {
            Success = true,
            Message = "Company deleted successfully."
        });
    }
}
