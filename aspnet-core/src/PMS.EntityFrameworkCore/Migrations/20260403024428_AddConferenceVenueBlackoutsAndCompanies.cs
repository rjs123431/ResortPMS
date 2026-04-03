using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddConferenceVenueBlackoutsAndCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ConferenceCompanyId",
                table: "ConferenceBooking",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConferenceCompany",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Phone = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConferenceCompany", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConferenceVenueBlackout",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VenueId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    StartDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConferenceVenueBlackout", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConferenceVenueBlackout_ConferenceVenue_VenueId",
                        column: x => x.VenueId,
                        principalTable: "ConferenceVenue",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceBooking_ConferenceCompanyId",
                table: "ConferenceBooking",
                column: "ConferenceCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceCompany_IsActive",
                table: "ConferenceCompany",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceCompany_Name",
                table: "ConferenceCompany",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceVenueBlackout_VenueId_StartDateTime",
                table: "ConferenceVenueBlackout",
                columns: new[] { "VenueId", "StartDateTime" });

            migrationBuilder.AddForeignKey(
                name: "FK_ConferenceBooking_ConferenceCompany_ConferenceCompanyId",
                table: "ConferenceBooking",
                column: "ConferenceCompanyId",
                principalTable: "ConferenceCompany",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConferenceBooking_ConferenceCompany_ConferenceCompanyId",
                table: "ConferenceBooking");

            migrationBuilder.DropTable(
                name: "ConferenceCompany");

            migrationBuilder.DropTable(
                name: "ConferenceVenueBlackout");

            migrationBuilder.DropIndex(
                name: "IX_ConferenceBooking_ConferenceCompanyId",
                table: "ConferenceBooking");

            migrationBuilder.DropColumn(
                name: "ConferenceCompanyId",
                table: "ConferenceBooking");
        }
    }
}
