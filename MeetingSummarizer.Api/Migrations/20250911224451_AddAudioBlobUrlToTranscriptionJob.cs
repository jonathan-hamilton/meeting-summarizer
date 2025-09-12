using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioBlobUrlToTranscriptionJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudioBlobUrl",
                table: "BatchTranscriptionJobs",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioBlobUrl",
                table: "BatchTranscriptionJobs");
        }
    }
}
