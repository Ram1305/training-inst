using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyRoleAndCompanyOrderCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "CompanyOrders",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "CompanyOrders");
        }
    }
}
