using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomentRank.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoRatingsAndPhotoComparisons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PhotoComparisons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EventId = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    PhotoAId = table.Column<int>(type: "INTEGER", nullable: false),
                    PhotoBId = table.Column<int>(type: "INTEGER", nullable: false),
                    WinnerPhotoId = table.Column<int>(type: "INTEGER", nullable: true),
                    VoterId = table.Column<int>(type: "INTEGER", nullable: false),
                    PhotoAEloBefore = table.Column<double>(type: "REAL", nullable: false),
                    PhotoBEloBefore = table.Column<double>(type: "REAL", nullable: false),
                    PhotoAEloAfter = table.Column<double>(type: "REAL", nullable: false),
                    PhotoBEloAfter = table.Column<double>(type: "REAL", nullable: false),
                    WasSkipped = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoComparisons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoComparisons_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhotoComparisons_Photos_PhotoAId",
                        column: x => x.PhotoAId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhotoComparisons_Photos_PhotoBId",
                        column: x => x.PhotoBId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhotoComparisons_Photos_WinnerPhotoId",
                        column: x => x.WinnerPhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhotoComparisons_Users_VoterId",
                        column: x => x.VoterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PhotoRatings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PhotoId = table.Column<int>(type: "INTEGER", nullable: false),
                    EventId = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    EloScore = table.Column<double>(type: "REAL", nullable: false),
                    Uncertainty = table.Column<double>(type: "REAL", nullable: false),
                    KFactor = table.Column<double>(type: "REAL", nullable: false),
                    ComparisonCount = table.Column<int>(type: "INTEGER", nullable: false),
                    WinCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsBootstrapped = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsStable = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoRatings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoRatings_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhotoRatings_Photos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_EventId_Category",
                table: "PhotoComparisons",
                columns: new[] { "EventId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_EventId_Category_PhotoAId_PhotoBId",
                table: "PhotoComparisons",
                columns: new[] { "EventId", "Category", "PhotoAId", "PhotoBId" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_PhotoAId",
                table: "PhotoComparisons",
                column: "PhotoAId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_PhotoBId",
                table: "PhotoComparisons",
                column: "PhotoBId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_VoterId_EventId_CreatedAt",
                table: "PhotoComparisons",
                columns: new[] { "VoterId", "EventId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoComparisons_WinnerPhotoId",
                table: "PhotoComparisons",
                column: "WinnerPhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoRatings_EventId_Category_EloScore",
                table: "PhotoRatings",
                columns: new[] { "EventId", "Category", "EloScore" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoRatings_EventId_Category_Uncertainty",
                table: "PhotoRatings",
                columns: new[] { "EventId", "Category", "Uncertainty" });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoRatings_PhotoId_EventId_Category",
                table: "PhotoRatings",
                columns: new[] { "PhotoId", "EventId", "Category" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PhotoComparisons");

            migrationBuilder.DropTable(
                name: "PhotoRatings");
        }
    }
}
