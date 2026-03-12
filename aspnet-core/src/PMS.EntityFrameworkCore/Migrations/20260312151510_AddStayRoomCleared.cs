using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddStayRoomCleared : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ClearedAt",
                table: "StayRoom",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ClearedByStaffId",
                table: "StayRoom",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCleared",
                table: "StayRoom",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_ClearedByStaffId",
                table: "StayRoom",
                column: "ClearedByStaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_StayRoom_Staff_ClearedByStaffId",
                table: "StayRoom",
                column: "ClearedByStaffId",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StayRoom_Staff_ClearedByStaffId",
                table: "StayRoom");

            migrationBuilder.DropIndex(
                name: "IX_StayRoom_ClearedByStaffId",
                table: "StayRoom");

            migrationBuilder.DropColumn(
                name: "ClearedAt",
                table: "StayRoom");

            migrationBuilder.DropColumn(
                name: "ClearedByStaffId",
                table: "StayRoom");

            migrationBuilder.DropColumn(
                name: "IsCleared",
                table: "StayRoom");
        }
    }
}
