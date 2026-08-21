using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByAdminId",
                table: "Companies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            // Preserve access for companies that were active before the
            // approval workflow was introduced.
            migrationBuilder.Sql(
                "UPDATE Companies SET ApprovalStatus = 'Approved', ApprovedAt = CreatedAt WHERE IsActive = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Companies");
        }
    }
}
