using Backend.Constants;
using Backend.DTOs.AdminReports;
using Backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Services.AdminReports;
namespace Backend.Controllers
{
    [ApiController]
    [Route("api/Admin/reports")]
    [Authorize(Roles = Roles.Admin)]
    public class AdminReportsController : ControllerBase
    {
        private readonly IAdminReportsService _service;

        public AdminReportsController(
            IAdminReportsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<AdminReportDto>>
            GetReports(
                [FromQuery] DateTime? from,
                [FromQuery] DateTime? to,
                CancellationToken cancellationToken)
        {
            var result =
                await _service.GetReportAsync(
                    from,
                    to,
                    cancellationToken);

            return Ok(result);
        }
    }
}