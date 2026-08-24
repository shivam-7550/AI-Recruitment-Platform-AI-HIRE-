using Backend.DTOs.Company;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ICompanyRepository _companyRepository;
    private readonly INotificationService _notificationService;


    public CompanyController(
        ICompanyService companyService,
        ICompanyRepository companyRepository,
        INotificationService notificationService)
    {
        _companyService =
            companyService;

        _companyRepository =
            companyRepository;

        _notificationService =
            notificationService;
    }


    // =========================================================
    // Create Company
    // POST: api/Company
    // =========================================================

    [Authorize(Roles = "Company")]
    [HttpPost]
    public async Task<IActionResult> CreateCompany(
        [FromBody] CreateCompanyDto dto,
        CancellationToken cancellationToken)
    {
        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);


        if (!Guid.TryParse(
                userIdClaim,
                out var userId))
        {
            return Unauthorized();
        }


        dto.UserId =
            userId;


        var company =
            await _companyService
                .CreateCompanyAsync(
                    dto,
                    cancellationToken);


        return CreatedAtAction(
            nameof(GetCompanyById),
            new
            {
                id = company.Id
            },
            company);
    }


    // =========================================================
    // Get All Companies
    // GET: api/Company
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllCompanies(
        CancellationToken cancellationToken)
    {
        var companies =
            await _companyService
                .GetAllCompaniesAsync(
                    cancellationToken);


        return Ok(companies);
    }


    // =========================================================
    // Get Company By Id
    // GET: api/Company/{id}
    // =========================================================

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCompanyById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyService
                .GetCompanyByIdAsync(
                    id,
                    cancellationToken);


        if (company == null)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        return Ok(company);
    }


    // =========================================================
    // Get Company By User Id
    // GET: api/Company/user/{userId}
    // =========================================================

    [Authorize(Roles = "Company,Admin")]
    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetCompanyByUserId(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var currentUserId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);


        if (!User.IsInRole("Admin") &&
            currentUserId != userId.ToString())
        {
            return Forbid();
        }


        var company =
            await _companyService
                .GetCompanyByUserIdAsync(
                    userId,
                    cancellationToken);


        if (company == null)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        return Ok(company);
    }


    // =========================================================
    // Update Company
    // PUT: api/Company/{id}
    // =========================================================

    [Authorize(Roles = "Company,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCompany(
        Guid id,
        [FromBody] UpdateCompanyDto dto,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyRepository
                .GetCompanyByIdAsync(
                    id,
                    cancellationToken);


        if (company == null)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        var currentUserId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);


        if (!User.IsInRole("Admin") &&
            currentUserId != company.UserId.ToString())
        {
            return Forbid();
        }


        var updated =
            await _companyService
                .UpdateCompanyAsync(
                    id,
                    dto,
                    cancellationToken);


        if (!updated)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        return Ok(
            new
            {
                Success = true,
                Message =
                    "Company updated successfully."
            });
    }


    // =========================================================
    // Delete Company
    // DELETE: api/Company/{id}
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted =
            await _companyService
                .DeleteCompanyAsync(
                    id,
                    cancellationToken);


        if (!deleted)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        return Ok(
            new
            {
                Success = true,
                Message =
                    "Company deleted successfully."
            });
    }


    // =========================================================
    // Approve Company
    // PUT: api/Company/{id}/approve
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> ApproveCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyRepository
                .GetCompanyByIdAsync(
                    id,
                    cancellationToken);


        if (company == null)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        // =====================================================
        // Prevent Duplicate Approval
        // =====================================================

        if (company.ApprovalStatus
            .Equals(
                "Approved",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                new
                {
                    Success = false,
                    Message =
                        "Company is already approved."
                });
        }


        // =====================================================
        // Get Admin User Id
        // =====================================================

        var adminClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);


        Guid? adminId = null;


        if (Guid.TryParse(
                adminClaim,
                out var parsedAdminId))
        {
            adminId =
                parsedAdminId;
        }


        // =====================================================
        // Update Approval Information
        // =====================================================

        company.ApprovalStatus =
            "Approved";

        company.IsActive =
            true;

        company.ApprovedAt =
            DateTime.UtcNow;

        company.ApprovedByAdminId =
            adminId;

        company.RejectionReason =
            null;

        company.UpdatedAt =
            DateTime.UtcNow;


        // =====================================================
        // Save Company
        // =====================================================

        await _companyRepository
            .UpdateCompanyAsync(
                company,
                cancellationToken);


        await _companyRepository
            .SaveChangesAsync(
                cancellationToken);


        // =====================================================
        // Notify Company
        // =====================================================

        await _notificationService
            .NotifyCompanyApprovalAsync(
                company.UserId,
                company.CompanyName,
                "Approved",
                null,
                cancellationToken);


        return Ok(
            new
            {
                Success = true,
                Message =
                    "Company approved successfully."
            });
    }


    // =========================================================
    // Reject Company
    // PUT: api/Company/{id}/reject
    // =========================================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> RejectCompany(
        Guid id,
        [FromBody] CompanyRejectionRequest request,
        CancellationToken cancellationToken)
    {
        var company =
            await _companyRepository
                .GetCompanyByIdAsync(
                    id,
                    cancellationToken);


        if (company == null)
        {
            return NotFound(
                new
                {
                    Success = false,
                    Message =
                        "Company not found."
                });
        }


        // =====================================================
        // Prevent Duplicate Rejection
        // =====================================================

        if (company.ApprovalStatus
            .Equals(
                "Rejected",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                new
                {
                    Success = false,
                    Message =
                        "Company is already rejected."
                });
        }


        // =====================================================
        // Prepare Rejection Reason
        // =====================================================

        var rejectionReason =
            string.IsNullOrWhiteSpace(
                request?.Reason)
                ? "Company verification was not approved."
                : request.Reason.Trim();


        // =====================================================
        // Update Company
        // =====================================================

        company.ApprovalStatus =
            "Rejected";

        company.IsActive =
            false;

        company.ApprovedAt =
            null;

        company.ApprovedByAdminId =
            null;

        company.RejectionReason =
            rejectionReason;

        company.UpdatedAt =
            DateTime.UtcNow;


        // =====================================================
        // Save Changes
        // =====================================================

        await _companyRepository
            .UpdateCompanyAsync(
                company,
                cancellationToken);


        await _companyRepository
            .SaveChangesAsync(
                cancellationToken);


        // =====================================================
        // Notify Company
        // =====================================================

        await _notificationService
            .NotifyCompanyApprovalAsync(
                company.UserId,
                company.CompanyName,
                "Rejected",
                company.RejectionReason,
                cancellationToken);


        return Ok(
            new
            {
                Success = true,
                Message =
                    "Company rejected successfully."
            });
    }
}


// =============================================================
// Company Rejection Request
// =============================================================

public sealed class CompanyRejectionRequest
{
    public string? Reason { get; set; }
}