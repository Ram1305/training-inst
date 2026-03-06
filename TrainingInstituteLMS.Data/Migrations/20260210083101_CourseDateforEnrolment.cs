using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class CourseDateforEnrolment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CourseDateId",
                table: "Enrollments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EnrollmentLinks",
                columns: table => new
                {
                    LinkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UniqueCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CourseId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CourseDateId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    QrCodeData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MaxUses = table.Column<int>(type: "int", nullable: true),
                    UsedCount = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnrollmentLinks", x => x.LinkId);
                    table.ForeignKey(
                        name: "FK_EnrollmentLinks_CourseDates_CourseDateId",
                        column: x => x.CourseDateId,
                        principalTable: "CourseDates",
                        principalColumn: "CourseDateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EnrollmentLinks_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "CourseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseDateId",
                table: "Enrollments",
                column: "CourseDateId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentLinks_CourseDateId",
                table: "EnrollmentLinks",
                column: "CourseDateId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentLinks_CourseId",
                table: "EnrollmentLinks",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_EnrollmentLinks_UniqueCode",
                table: "EnrollmentLinks",
                column: "UniqueCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_CourseDates_CourseDateId",
                table: "Enrollments",
                column: "CourseDateId",
                principalTable: "CourseDates",
                principalColumn: "CourseDateId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_CourseDates_CourseDateId",
                table: "Enrollments");

            migrationBuilder.DropTable(
                name: "EnrollmentLinks");

            migrationBuilder.DropIndex(
                name: "IX_Enrollments_CourseDateId",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "CourseDateId",
                table: "Enrollments");
        }
    }
}
