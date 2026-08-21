using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmailNotifications = table.Column<bool>(type: "bit", nullable: false),
                    ApplicationUpdates = table.Column<bool>(type: "bit", nullable: false),
                    JobAlerts = table.Column<bool>(type: "bit", nullable: false),
                    RecruiterMessages = table.Column<bool>(type: "bit", nullable: false),
                    MarketingEmails = table.Column<bool>(type: "bit", nullable: false),
                    WeeklyJobDigest = table.Column<bool>(type: "bit", nullable: false),
                    ApplicationStatusNotifications = table.Column<bool>(type: "bit", nullable: false),
                    ProfileVisibility = table.Column<bool>(type: "bit", nullable: false),
                    ShowContactInformation = table.Column<bool>(type: "bit", nullable: false),
                    AllowRecruiterSearch = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId",
                table: "UserSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSettings");
        }
    }
}
