using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class LinkApplicationsToResumes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PersonalizedJobRecommendations",
                table: "UserSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RecruiterSearchable",
                table: "UserSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ResumeVisibility",
                table: "UserSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ResumeId",
                table: "JobApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE application
                SET application.ResumeId = resume.Id
                FROM JobApplications AS application
                OUTER APPLY
                (
                    SELECT TOP (1) candidateResume.Id
                    FROM Resumes AS candidateResume
                    WHERE candidateResume.UserId = application.UserId
                    ORDER BY candidateResume.UploadedAt DESC
                ) AS resume
                WHERE application.ResumeId IS NULL
                  AND resume.Id IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_ResumeId",
                table: "JobApplications",
                column: "ResumeId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_Resumes_ResumeId",
                table: "JobApplications",
                column: "ResumeId",
                principalTable: "Resumes",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_Resumes_ResumeId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_ResumeId",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "PersonalizedJobRecommendations",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "RecruiterSearchable",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "ResumeVisibility",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "ResumeId",
                table: "JobApplications");
        }
    }
}
