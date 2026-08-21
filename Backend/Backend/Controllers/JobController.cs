using Backend.DTOs.Job;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly ICompanyRepository _companyRepository;


    public JobController(
        IJobService jobService,
        ICompanyRepository companyRepository)
    {
        _jobService = jobService;
        _companyRepository = companyRepository;
    }


    // ==========================================
    // COMPANY CREATE JOB
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpPost]
    public async Task<IActionResult> CreateJob(
        CreateJobDto dto,
        CancellationToken cancellationToken)
    {
        var company = await ResolveCompanyAsync(cancellationToken);

        if (company == null)
            return BadRequest(
                "Complete your company profile before posting a job.");

        if (company.ApprovalStatus != "Approved" ||
            !company.IsActive)
        {
            return StatusCode(
                403,
                "Your company must be approved by an admin before posting jobs.");
        }


        var result =
            await _jobService.CreateJobAsync(
                company.Id,
                dto,
                cancellationToken);


        return Ok(result);
    }



    // ==========================================
    // PUBLIC - GET ALL JOBS
    // ==========================================

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllJobs(
        CancellationToken cancellationToken)
    {
        var jobs =
            await _jobService.GetAllJobsAsync(
                cancellationToken);

        return Ok(jobs);
    }



    // ==========================================
    // PUBLIC - GET JOB BY ID
    // ==========================================

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJob(
        Guid id,
        CancellationToken cancellationToken)
    {
        var job =
            await _jobService.GetJobByIdAsync(
                id,
                cancellationToken);


        if (job == null)
            return NotFound("Job not found.");


        return Ok(job);
    }




    // ==========================================
    // COMPANY UPDATE JOB
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateJob(
        Guid id,
        UpdateJobDto dto,
        CancellationToken cancellationToken)
    {

        var company =
            await ResolveCompanyAsync(cancellationToken);


        if (company == null)
            return BadRequest(
                "Complete your company profile first.");


        if (company.ApprovalStatus != "Approved" ||
            !company.IsActive)
        {
            return StatusCode(
                403,
                "Your company is not approved.");
        }



        var updated =
            await _jobService.UpdateJobAsync(
                company.Id,
                id,
                dto,
                cancellationToken);



        if (!updated)
            return NotFound(
                "Job not found or you are not authorized.");



        return Ok(
            "Job Updated Successfully");
    }




    // ==========================================
    // COMPANY DELETE JOB
    // ==========================================

    [Authorize(Roles = "Company")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteJob(
        Guid id,
        CancellationToken cancellationToken)
    {

        var company =
            await ResolveCompanyAsync(cancellationToken);



        if (company == null)
            return BadRequest(
                "Complete your company profile first.");



        if (company.ApprovalStatus != "Approved" ||
            !company.IsActive)
        {
            return StatusCode(
                403,
                "Your company is not approved.");
        }




        var deleted =
            await _jobService.DeleteJobAsync(
                company.Id,
                id,
                cancellationToken);



        if (!deleted)
            return NotFound(
                "Job not found or you are not authorized.");



        return Ok(
            "Job Deleted Successfully");
    }





    private async Task<Backend.Models.Company?> ResolveCompanyAsync(
        CancellationToken cancellationToken)
    {

        var companyIdClaim =
            User.FindFirstValue("CompanyId");


        if (Guid.TryParse(
            companyIdClaim,
            out var companyId))
        {

            return await _companyRepository
                .GetCompanyByIdAsync(
                    companyId,
                    cancellationToken);
        }



        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);



        if (!Guid.TryParse(
            userIdClaim,
            out var userId))
        {
            return null;
        }



        return await _companyRepository
            .GetCompanyByUserIdAsync(
                userId,
                cancellationToken);
    }
}