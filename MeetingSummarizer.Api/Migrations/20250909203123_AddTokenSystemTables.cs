using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingSummarizer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenSystemTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TokenPurchases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokensPurchased = table.Column<int>(type: "int", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PaymentId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    PaymentStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StripeSessionId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Metadata = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenPurchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenPurchases_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TokenUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MeetingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokensUsed = table.Column<int>(type: "int", nullable: false),
                    MeetingDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    CostInUsd = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    UsageDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ProcessingType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VolumeDiscountApplied = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Metadata = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokenUsages_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TokenUsages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_TokenPurchases_PaymentId",
                table: "TokenPurchases",
                column: "PaymentId",
                unique: true,
                filter: "[PaymentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TokenPurchases_StripeSessionId",
                table: "TokenPurchases",
                column: "StripeSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_TokenPurchases_UserId_PurchaseDate",
                table: "TokenPurchases",
                columns: new[] { "UserId", "PurchaseDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TokenUsages_MeetingId",
                table: "TokenUsages",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_TokenUsages_UserId_UsageDate",
                table: "TokenUsages",
                columns: new[] { "UserId", "UsageDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TokenPurchases");

            migrationBuilder.DropTable(
                name: "TokenUsages");
        }
    }
}
