namespace Backend.DTOs.Dashboard
{
    public class AdminDashboardDto
    {
        public AdminStatsDto Stats { get; set; } = new();

        public List<UserRoleCountDto> UsersByRole { get; set; } = new();

        public List<PendingCompanyDto> PendingCompanies { get; set; } = new();
    }
}