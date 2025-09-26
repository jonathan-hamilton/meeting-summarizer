using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWebhookEventTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WebhookEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PaymentIntentId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RawPayload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEvents_EventId",
                table: "WebhookEvents",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEvents_EventType_ProcessedAt",
                table: "WebhookEvents",
                columns: new[] { "EventType", "ProcessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEvents_PaymentIntentId",
                table: "WebhookEvents",
                column: "PaymentIntentId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookEvents_ProcessedAt",
                table: "WebhookEvents",
                column: "ProcessedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WebhookEvents");
        }
    }
}
