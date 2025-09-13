using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class TranscriptStorageOptimizationUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "CompressedTranscriptSize",
                table: "BatchTranscriptionJobs",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTranscriptInBlobStorage",
                table: "BatchTranscriptionJobs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TranscriptBlobUrl",
                table: "BatchTranscriptionJobs",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TranscriptSegments",
                columns: table => new
                {
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SegmentIndex = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    StartTime = table.Column<double>(type: "float", nullable: false),
                    EndTime = table.Column<double>(type: "float", nullable: false),
                    SpeakerId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Confidence = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TranscriptSegments", x => new { x.JobId, x.SegmentIndex });
                    table.ForeignKey(
                        name: "FK_TranscriptSegments_BatchTranscriptionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "BatchTranscriptionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TranscriptSegments_JobId",
                table: "TranscriptSegments",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_TranscriptSegments_SpeakerId",
                table: "TranscriptSegments",
                column: "SpeakerId");

            migrationBuilder.CreateIndex(
                name: "IX_TranscriptSegments_StartTime",
                table: "TranscriptSegments",
                column: "StartTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TranscriptSegments");

            migrationBuilder.DropColumn(
                name: "CompressedTranscriptSize",
                table: "BatchTranscriptionJobs");

            migrationBuilder.DropColumn(
                name: "IsTranscriptInBlobStorage",
                table: "BatchTranscriptionJobs");

            migrationBuilder.DropColumn(
                name: "TranscriptBlobUrl",
                table: "BatchTranscriptionJobs");
        }
    }
}
