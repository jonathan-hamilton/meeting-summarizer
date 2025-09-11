using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBatchTranscriptionJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BatchTranscriptionJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AzureJobId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    ProgressPercentage = table.Column<int>(type: "int", nullable: false),
                    ResultsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    MaxRetries = table.Column<int>(type: "int", nullable: false),
                    TokensCharged = table.Column<int>(type: "int", nullable: false),
                    RefundIssued = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BatchTranscriptionJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BatchTranscriptionJobs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_AzureJobId",
                table: "BatchTranscriptionJobs",
                column: "AzureJobId",
                unique: true,
                filter: "[AzureJobId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_Status",
                table: "BatchTranscriptionJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_SubmittedAt",
                table: "BatchTranscriptionJobs",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_UserId",
                table: "BatchTranscriptionJobs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BatchTranscriptionJobs");
        }
    }
}
