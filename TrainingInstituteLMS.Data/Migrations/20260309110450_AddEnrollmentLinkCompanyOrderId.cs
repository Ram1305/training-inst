using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentLinkCompanyOrderId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyOrderId",
                table: "EnrollmentLinks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "CompanyOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "CreatedAt", "Description", "RoleName" },
                values: new object[] { new Guid("55555555-5555-5555-5555-555555555555"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Company account (bulk orders)", "Company" });

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentLinks_CompanyOrderId",
                table: "EnrollmentLinks",
                column: "CompanyOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_EnrollmentLinks_CompanyOrders_CompanyOrderId",
                table: "EnrollmentLinks",
                column: "CompanyOrderId",
                principalTable: "CompanyOrders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EnrollmentLinks_CompanyOrders_CompanyOrderId",
                table: "EnrollmentLinks");

            migrationBuilder.DropIndex(
                name: "IX_EnrollmentLinks_CompanyOrderId",
                table: "EnrollmentLinks");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"));

            migrationBuilder.DropColumn(
                name: "CompanyOrderId",
                table: "EnrollmentLinks");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "CompanyOrders");
        }
    }
}
