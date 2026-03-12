using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentProofPathToVOC : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentProofPath",
                table: "VOCSubmissions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MobileNumber",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentProofPath",
                table: "VOCSubmissions");

            migrationBuilder.DropColumn(
                name: "MobileNumber",
                table: "Companies");
        }
    }
}
