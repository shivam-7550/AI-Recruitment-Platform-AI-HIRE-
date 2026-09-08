using Backend.DTOs.AdminReports;

namespace Backend.Interfaces.Services
{
    public interface IAdminReportsService
    {
        Task<AdminReportDto> GetReportAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken);
    }
}