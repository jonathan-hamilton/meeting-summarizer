using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFastTranscriptionJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FastTranscriptionJobId",
                table: "TranscriptSegments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FastTranscriptionJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeetingId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ProcessingMethod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "fast"),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    ProgressPercentage = table.Column<int>(type: "int", nullable: false),
                    TranscriptBlobUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    IsTranscriptInBlobStorage = table.Column<bool>(type: "bit", nullable: false),
                    CompressedTranscriptSize = table.Column<long>(type: "bigint", nullable: true),
                    ResultsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TokensCharged = table.Column<int>(type: "int", nullable: false),
                    RefundIssued = table.Column<bool>(type: "bit", nullable: false),
                    AudioBlobUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FastTranscriptionJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FastTranscriptionJobs_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FastTranscriptionJobs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TranscriptSegments_FastTranscriptionJobId",
                table: "TranscriptSegments",
                column: "FastTranscriptionJobId");

            migrationBuilder.CreateIndex(
                name: "IX_FastTranscriptionJobs_MeetingId",
                table: "FastTranscriptionJobs",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_FastTranscriptionJobs_ProcessingMethod",
                table: "FastTranscriptionJobs",
                column: "ProcessingMethod");

            migrationBuilder.CreateIndex(
                name: "IX_FastTranscriptionJobs_Status",
                table: "FastTranscriptionJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_FastTranscriptionJobs_SubmittedAt",
                table: "FastTranscriptionJobs",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FastTranscriptionJobs_UserId",
                table: "FastTranscriptionJobs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_FastTranscriptionJobId",
                table: "TranscriptSegments",
                column: "FastTranscriptionJobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_FastTranscriptionJobId",
                table: "TranscriptSegments");

            migrationBuilder.DropTable(
                name: "FastTranscriptionJobs");

            migrationBuilder.DropIndex(
                name: "IX_TranscriptSegments_FastTranscriptionJobId",
                table: "TranscriptSegments");

            migrationBuilder.DropColumn(
                name: "FastTranscriptionJobId",
                table: "TranscriptSegments");
        }
    }
}
