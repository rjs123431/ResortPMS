using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestRequestLinkToHousekeepingTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GuestRequestId",
                table: "HousekeepingTask",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTask_GuestRequestId",
                table: "HousekeepingTask",
                column: "GuestRequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_HousekeepingTask_GuestRequest_GuestRequestId",
                table: "HousekeepingTask",
                column: "GuestRequestId",
                principalTable: "GuestRequest",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HousekeepingTask_GuestRequest_GuestRequestId",
                table: "HousekeepingTask");

            migrationBuilder.DropIndex(
                name: "IX_HousekeepingTask_GuestRequestId",
                table: "HousekeepingTask");

            migrationBuilder.DropColumn(
                name: "GuestRequestId",
                table: "HousekeepingTask");
        }
    }
}
