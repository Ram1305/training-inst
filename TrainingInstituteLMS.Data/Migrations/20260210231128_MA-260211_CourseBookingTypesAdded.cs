using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class MA260211_CourseBookingTypesAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ExperienceBookingEnabled",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ExperienceOriginalPrice",
                table: "Courses",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExperiencePrice",
                table: "Courses",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NoExperienceOriginalPrice",
                table: "Courses",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NoExperiencePrice",
                table: "Courses",
                type: "decimal(10,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExperienceBookingEnabled",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ExperienceOriginalPrice",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ExperiencePrice",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "NoExperienceOriginalPrice",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "NoExperiencePrice",
                table: "Courses");
        }
    }
}
