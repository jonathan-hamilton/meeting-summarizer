using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDialogTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AiChatDiscoveryShownAt",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasAcknowledgedLegalDisclaimer",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasSeenAiChatDiscovery",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LegalDisclaimerAcknowledgedAt",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiChatDiscoveryShownAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HasAcknowledgedLegalDisclaimer",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HasSeenAiChatDiscovery",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LegalDisclaimerAcknowledgedAt",
                table: "Users");
        }
    }
}
