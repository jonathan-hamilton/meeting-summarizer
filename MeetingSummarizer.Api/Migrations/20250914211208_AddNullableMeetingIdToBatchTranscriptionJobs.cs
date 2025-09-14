using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNullableMeetingIdToBatchTranscriptionJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MeetingId",
                table: "BatchTranscriptionJobs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BatchTranscriptionJobs_MeetingId",
                table: "BatchTranscriptionJobs",
                column: "MeetingId");

            migrationBuilder.AddForeignKey(
                name: "FK_BatchTranscriptionJobs_Meetings_MeetingId",
                table: "BatchTranscriptionJobs",
                column: "MeetingId",
                principalTable: "Meetings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BatchTranscriptionJobs_Meetings_MeetingId",
                table: "BatchTranscriptionJobs");

            migrationBuilder.DropIndex(
                name: "IX_BatchTranscriptionJobs_MeetingId",
                table: "BatchTranscriptionJobs");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                table: "BatchTranscriptionJobs");
        }
    }
}
