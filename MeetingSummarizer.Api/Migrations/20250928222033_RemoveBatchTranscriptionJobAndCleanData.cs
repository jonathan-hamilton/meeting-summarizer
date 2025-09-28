using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBatchTranscriptionJobAndCleanData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Clean up existing data that references BatchTranscriptionJobs
            migrationBuilder.Sql("DELETE FROM [TranscriptSegments]");
            migrationBuilder.Sql("DELETE FROM [TokenRefunds]");
            
            migrationBuilder.DropForeignKey(
                name: "FK_TokenRefunds_BatchTranscriptionJobs_BatchJobId",
                table: "TokenRefunds");

            migrationBuilder.DropForeignKey(
                name: "FK_TranscriptSegments_BatchTranscriptionJobs_JobId",
                table: "TranscriptSegments");

            migrationBuilder.DropForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_FastTranscriptionJobId",
                table: "TranscriptSegments");

            migrationBuilder.DropTable(
                name: "BatchTranscriptionJobs");

            migrationBuilder.DropIndex(
                name: "IX_TranscriptSegments_FastTranscriptionJobId",
                table: "TranscriptSegments");

            migrationBuilder.DropColumn(
                name: "FastTranscriptionJobId",
                table: "TranscriptSegments");

            migrationBuilder.RenameColumn(
                name: "BatchJobId",
                table: "TokenRefunds",
                newName: "FastJobId");

            migrationBuilder.RenameIndex(
                name: "IX_TokenRefunds_BatchJobId",
                table: "TokenRefunds",
                newName: "IX_TokenRefunds_FastJobId");

            migrationBuilder.AddForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds",
                column: "FastJobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_JobId",
                table: "TranscriptSegments",
                column: "JobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds");

            migrationBuilder.DropForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_JobId",
                table: "TranscriptSegments");

            migrationBuilder.RenameColumn(
                name: "FastJobId",
                table: "TokenRefunds",
                newName: "BatchJobId");

            migrationBuilder.RenameIndex(
                name: "IX_TokenRefunds_FastJobId",
                table: "TokenRefunds",
                newName: "IX_TokenRefunds_BatchJobId");

            migrationBuilder.AddColumn<Guid>(
                name: "FastTranscriptionJobId",
                table: "TranscriptSegments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BatchTranscriptionJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeetingId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AudioBlobUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    AzureJobId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompressedTranscriptSize = table.Column<long>(type: "bigint", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsTranscriptInBlobStorage = table.Column<bool>(type: "bit", nullable: false),
                    MaxRetries = table.Column<int>(type: "int", nullable: false),
                    ProgressPercentage = table.Column<int>(type: "int", nullable: false),
                    RefundIssued = table.Column<bool>(type: "bit", nullable: false),
                    ResultsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    TokensCharged = table.Column<int>(type: "int", nullable: false),
                    TranscriptBlobUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BatchTranscriptionJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BatchTranscriptionJobs_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BatchTranscriptionJobs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TranscriptSegments_FastTranscriptionJobId",
                table: "TranscriptSegments",
                column: "FastTranscriptionJobId");

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_AzureJobId",
                table: "BatchTranscriptionJobs",
                column: "AzureJobId",
                unique: true,
                filter: "[AzureJobId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_MeetingId",
                table: "BatchTranscriptionJobs",
                column: "MeetingId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_TokenRefunds_BatchTranscriptionJobs_BatchJobId",
                table: "TokenRefunds",
                column: "BatchJobId",
                principalTable: "BatchTranscriptionJobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TranscriptSegments_BatchTranscriptionJobs_JobId",
                table: "TranscriptSegments",
                column: "JobId",
                principalTable: "BatchTranscriptionJobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TranscriptSegments_FastTranscriptionJobs_FastTranscriptionJobId",
                table: "TranscriptSegments",
                column: "FastTranscriptionJobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id");
        }
    }
}
