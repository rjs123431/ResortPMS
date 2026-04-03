using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddConferenceBookingEventTypeLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EventTypeId",
                table: "ConferenceBooking",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConferenceBooking_EventTypeId",
                table: "ConferenceBooking",
                column: "EventTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ConferenceBooking_EventType_EventTypeId",
                table: "ConferenceBooking",
                column: "EventTypeId",
                principalTable: "EventType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConferenceBooking_EventType_EventTypeId",
                table: "ConferenceBooking");

            migrationBuilder.DropIndex(
                name: "IX_ConferenceBooking_EventTypeId",
                table: "ConferenceBooking");

            migrationBuilder.DropColumn(
                name: "EventTypeId",
                table: "ConferenceBooking");
        }
    }
}
