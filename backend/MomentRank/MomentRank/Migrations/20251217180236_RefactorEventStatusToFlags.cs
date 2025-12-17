using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomentRank.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEventStatusToFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new bool columns
            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsEnded",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            // Migrate existing data: Status 3=Ended, 4=Cancelled, 5=Archived
            migrationBuilder.Sql("UPDATE Events SET IsEnded = 1 WHERE Status = 3");
            migrationBuilder.Sql("UPDATE Events SET IsCancelled = 1 WHERE Status = 4");
            migrationBuilder.Sql("UPDATE Events SET IsArchived = 1 WHERE Status = 5");

            // Drop old Status column
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Events");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add Status column
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Events",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1); // Default to Active

            // Migrate data back
            migrationBuilder.Sql("UPDATE Events SET Status = 3 WHERE IsEnded = 1");
            migrationBuilder.Sql("UPDATE Events SET Status = 4 WHERE IsCancelled = 1");
            migrationBuilder.Sql("UPDATE Events SET Status = 5 WHERE IsArchived = 1");

            // Drop bool columns
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "IsEnded",
                table: "Events");
        }
    }
}
