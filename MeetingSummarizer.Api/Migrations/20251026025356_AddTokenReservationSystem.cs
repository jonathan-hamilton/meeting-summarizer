using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenReservationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds");

            migrationBuilder.AlterColumn<Guid>(
                name: "FastJobId",
                table: "TokenRefunds",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "TokenReservationId",
                table: "Meetings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TokenReservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeetingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokensReserved = table.Column<int>(type: "int", nullable: false),
                    ReservedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenReservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenReservations_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TokenReservations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TokenReservations_ExpiresAt",
                table: "TokenReservations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_TokenReservations_MeetingId",
                table: "TokenReservations",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_TokenReservations_Status",
                table: "TokenReservations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TokenReservations_Status_ExpiresAt",
                table: "TokenReservations",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TokenReservations_UserId",
                table: "TokenReservations",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds",
                column: "FastJobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds");

            migrationBuilder.DropTable(
                name: "TokenReservations");

            migrationBuilder.DropColumn(
                name: "TokenReservationId",
                table: "Meetings");

            migrationBuilder.AlterColumn<Guid>(
                name: "FastJobId",
                table: "TokenRefunds",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TokenRefunds_FastTranscriptionJobs_FastJobId",
                table: "TokenRefunds",
                column: "FastJobId",
                principalTable: "FastTranscriptionJobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
