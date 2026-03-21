using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyPortalLinkAndBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "EnrollmentLinks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CompanyBillingStatements",
                columns: table => new
                {
                    StatementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SydneyBillingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyBillingStatements", x => x.StatementId);
                    table.ForeignKey(
                        name: "FK_CompanyBillingStatements_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "CompanyId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CompanyBillingLines",
                columns: table => new
                {
                    LineId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StatementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EnrollmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    CourseNameSnapshot = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    StudentNameSnapshot = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyBillingLines", x => x.LineId);
                    table.ForeignKey(
                        name: "FK_CompanyBillingLines_CompanyBillingStatements_StatementId",
                        column: x => x.StatementId,
                        principalTable: "CompanyBillingStatements",
                        principalColumn: "StatementId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyBillingLines_Enrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalTable: "Enrollments",
                        principalColumn: "EnrollmentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentLinks_CompanyId",
                table: "EnrollmentLinks",
                column: "CompanyId",
                unique: true,
                filter: "[CompanyId] IS NOT NULL AND [CompanyOrderId] IS NULL AND [CourseId] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyBillingLines_EnrollmentId",
                table: "CompanyBillingLines",
                column: "EnrollmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyBillingLines_StatementId",
                table: "CompanyBillingLines",
                column: "StatementId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyBillingStatements_CompanyId_SydneyBillingDate_Status",
                table: "CompanyBillingStatements",
                columns: new[] { "CompanyId", "SydneyBillingDate", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_EnrollmentLinks_Companies_CompanyId",
                table: "EnrollmentLinks",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EnrollmentLinks_Companies_CompanyId",
                table: "EnrollmentLinks");

            migrationBuilder.DropTable(
                name: "CompanyBillingLines");

            migrationBuilder.DropTable(
                name: "CompanyBillingStatements");

            migrationBuilder.DropIndex(
                name: "IX_EnrollmentLinks_CompanyId",
                table: "EnrollmentLinks");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "EnrollmentLinks");
        }
    }
}
