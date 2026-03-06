using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class CourseDates_EntityUpdate_Added_TeacherId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TeacherId",
                table: "CourseDates",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseDates_TeacherId",
                table: "CourseDates",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseDates_Users_TeacherId",
                table: "CourseDates",
                column: "TeacherId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseDates_Users_TeacherId",
                table: "CourseDates");

            migrationBuilder.DropIndex(
                name: "IX_CourseDates_TeacherId",
                table: "CourseDates");

            migrationBuilder.DropColumn(
                name: "TeacherId",
                table: "CourseDates");
        }
    }
}
