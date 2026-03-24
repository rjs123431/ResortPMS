using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class EnforceUniqueRoomDailyInventoryRoomDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RoomDailyInventory_RoomId_InventoryDate",
                table: "RoomDailyInventory");

            migrationBuilder.CreateIndex(
                name: "IX_RoomDailyInventory_RoomId_InventoryDate",
                table: "RoomDailyInventory",
                columns: new[] { "RoomId", "InventoryDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RoomDailyInventory_RoomId_InventoryDate",
                table: "RoomDailyInventory");

            migrationBuilder.CreateIndex(
                name: "IX_RoomDailyInventory_RoomId_InventoryDate",
                table: "RoomDailyInventory",
                columns: new[] { "RoomId", "InventoryDate" });
        }
    }
}
