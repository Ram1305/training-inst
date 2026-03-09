using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingInstituteLMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class UseEnrollmentLinkOptionsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create new table first
            migrationBuilder.CreateTable(
                name: "EnrollmentLinkOptions",
                columns: table => new
                {
                    LinkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AllowPayLater = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnrollmentLinkOptions", x => x.LinkId);
                    table.ForeignKey(
                        name: "FK_EnrollmentLinkOptions_EnrollmentLinks_LinkId",
                        column: x => x.LinkId,
                        principalTable: "EnrollmentLinks",
                        principalColumn: "LinkId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Migrate existing data if AllowPayLater column exists, else insert false for all
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns 
                    WHERE object_id = OBJECT_ID('EnrollmentLinks') AND name = 'AllowPayLater')
                BEGIN
                    INSERT INTO [EnrollmentLinkOptions] ([LinkId], [AllowPayLater])
                    SELECT [LinkId], [AllowPayLater] FROM [EnrollmentLinks];
                    ALTER TABLE [EnrollmentLinks] DROP COLUMN [AllowPayLater];
                END
                ELSE
                BEGIN
                    INSERT INTO [EnrollmentLinkOptions] ([LinkId], [AllowPayLater])
                    SELECT [LinkId], 0 FROM [EnrollmentLinks];
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnrollmentLinkOptions");

            migrationBuilder.AddColumn<bool>(
                name: "AllowPayLater",
                table: "EnrollmentLinks",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
