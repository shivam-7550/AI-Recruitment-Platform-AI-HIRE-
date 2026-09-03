using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class ATSPhase12 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CandidateName",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "CurrentDesignation",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "Education",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "Resumes");

            migrationBuilder.RenameColumn(
                name: "Experience",
                table: "Resumes",
                newName: "ExperienceYears");

           

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalSummary",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EducationDetails",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Projects",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Certifications",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CertificationRequirements",
                table: "Jobs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EducationRequirements",
                table: "Jobs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PreferredSkills",
                table: "Jobs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "RequiresPortfolio",
                table: "Jobs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "CertificationMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "EducationMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "ExperienceMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "JobDescriptionMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "ProjectMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "SkillsMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "StructureMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "SummaryMatch",
                table: "JobApplications",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CertificationRequirements",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "EducationRequirements",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "PreferredSkills",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "RequiresPortfolio",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CertificationMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "EducationMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "ExperienceMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "JobDescriptionMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "ProjectMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "SkillsMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "StructureMatch",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "SummaryMatch",
                table: "JobApplications");

            migrationBuilder.RenameColumn(
                name: "Projects",
                table: "Resumes",
                newName: "Summary");

            migrationBuilder.RenameColumn(
                name: "ProfessionalSummary",
                table: "Resumes",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "ExperienceYears",
                table: "Resumes",
                newName: "Experience");

            migrationBuilder.RenameColumn(
                name: "EducationDetails",
                table: "Resumes",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "Certifications",
                table: "Resumes",
                newName: "Education");

            migrationBuilder.AddColumn<string>(
                name: "CandidateName",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrentDesignation",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
