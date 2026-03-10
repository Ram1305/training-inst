using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EnrollmentType",
                table: "Enrollments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnrollmentType",
                table: "Enrollments");
        }
    }
}
