using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInterviewModuleagain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Interviews_JobApplications_ApplicationId",
                table: "Interviews");

            migrationBuilder.AddForeignKey(
                name: "FK_Interviews_JobApplications_ApplicationId",
                table: "Interviews",
                column: "ApplicationId",
                principalTable: "JobApplications",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Interviews_JobApplications_ApplicationId",
                table: "Interviews");

            migrationBuilder.AddForeignKey(
                name: "FK_Interviews_JobApplications_ApplicationId",
                table: "Interviews",
                column: "ApplicationId",
                principalTable: "JobApplications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
