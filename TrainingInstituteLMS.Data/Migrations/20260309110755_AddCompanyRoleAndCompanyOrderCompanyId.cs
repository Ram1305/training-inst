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
            // Idempotent: skip if column already exists (e.g. from partial prior run)
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('CompanyOrders') AND name = 'CompanyId'
)
BEGIN
    ALTER TABLE CompanyOrders ADD CompanyId uniqueidentifier NULL;
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('CompanyOrders') AND name = 'CompanyId'
)
BEGIN
    ALTER TABLE CompanyOrders DROP COLUMN CompanyId;
END");
        }
    }
}
