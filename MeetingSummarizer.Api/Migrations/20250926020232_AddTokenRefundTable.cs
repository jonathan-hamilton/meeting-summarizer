using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenRefundTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TokenRefunds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchJobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokensRefunded = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RefundedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsAutomatic = table.Column<bool>(type: "bit", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenRefunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenRefunds_BatchTranscriptionJobs_BatchJobId",
                        column: x => x.BatchJobId,
                        principalTable: "BatchTranscriptionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TokenRefunds_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TokenRefunds_BatchJobId",
                table: "TokenRefunds",
                column: "BatchJobId");

            migrationBuilder.CreateIndex(
                name: "IX_TokenRefunds_RefundedAt",
                table: "TokenRefunds",
                column: "RefundedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TokenRefunds_UserId",
                table: "TokenRefunds",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TokenRefunds");
        }
    }
}
