using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddPosOrderServiceChargeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "RoomServiceChargeAmount",
                table: "PosOrder",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RoomServiceChargePercent",
                table: "PosOrder",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RoomServiceChargeType",
                table: "PosOrder",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceChargeAmount",
                table: "PosOrder",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceChargePercent",
                table: "PosOrder",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ServiceChargeType",
                table: "PosOrder",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RoomServiceChargeAmount",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "RoomServiceChargePercent",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "RoomServiceChargeType",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "ServiceChargeAmount",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "ServiceChargePercent",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "ServiceChargeType",
                table: "PosOrder");
        }
    }
}
