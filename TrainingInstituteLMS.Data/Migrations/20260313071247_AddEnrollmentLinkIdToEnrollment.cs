using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentLinkIdToEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Students_Companies_CompanyId",
                table: "Students");

            migrationBuilder.DropIndex(
                name: "IX_Students_CompanyId",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Students");

            migrationBuilder.AddColumn<Guid>(
                name: "EnrollmentLinkId",
                table: "Enrollments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_EnrollmentLinkId",
                table: "Enrollments",
                column: "EnrollmentLinkId");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_EnrollmentLinks_EnrollmentLinkId",
                table: "Enrollments",
                column: "EnrollmentLinkId",
                principalTable: "EnrollmentLinks",
                principalColumn: "LinkId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_EnrollmentLinks_EnrollmentLinkId",
                table: "Enrollments");

            migrationBuilder.DropIndex(
                name: "IX_Enrollments_EnrollmentLinkId",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "EnrollmentLinkId",
                table: "Enrollments");

            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "Students",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Students_CompanyId",
                table: "Students",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Students_Companies_CompanyId",
                table: "Students",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
