using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class ExtendCandidateProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentJobTitle",
                table: "UserProfiles",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmploymentType",
                table: "UserProfiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedSalary",
                table: "UserProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GithubUrl",
                table: "UserProfiles",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredJobTitle",
                table: "UserProfiles",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredLocation",
                table: "UserProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkMode",
                table: "UserProfiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentJobTitle",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "EmploymentType",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "ExpectedSalary",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "GithubUrl",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "PreferredJobTitle",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "PreferredLocation",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WorkMode",
                table: "UserProfiles");
        }
    }
}
