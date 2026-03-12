using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVOCEmailOTP : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "VOCSubmissions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedCoursesJson",
                table: "VOCSubmissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "VOCSubmissions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "VOCSubmissions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VOCEmailOTPs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    OTP = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VOCEmailOTPs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VOCEmailOTPs");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "VOCSubmissions");

            migrationBuilder.DropColumn(
                name: "SelectedCoursesJson",
                table: "VOCSubmissions");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "VOCSubmissions");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "VOCSubmissions");
        }
    }
}
