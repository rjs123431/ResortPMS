using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddOutletServiceCharges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "RoomServiceChargeAmount",
                table: "PosOutlet",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RoomServiceChargePercent",
                table: "PosOutlet",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RoomServiceChargeType",
                table: "PosOutlet",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceChargeFixedAmount",
                table: "PosOutlet",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceChargePercent",
                table: "PosOutlet",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ServiceChargeType",
                table: "PosOutlet",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RoomServiceChargeAmount",
                table: "PosOutlet");

            migrationBuilder.DropColumn(
                name: "RoomServiceChargePercent",
                table: "PosOutlet");

            migrationBuilder.DropColumn(
                name: "RoomServiceChargeType",
                table: "PosOutlet");

            migrationBuilder.DropColumn(
                name: "ServiceChargeFixedAmount",
                table: "PosOutlet");

            migrationBuilder.DropColumn(
                name: "ServiceChargePercent",
                table: "PosOutlet");

            migrationBuilder.DropColumn(
                name: "ServiceChargeType",
                table: "PosOutlet");
        }
    }
}
