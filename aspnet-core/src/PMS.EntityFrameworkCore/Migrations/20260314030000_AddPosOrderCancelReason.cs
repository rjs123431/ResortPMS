using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddPosOrderCancelReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CancelReasonType",
                table: "PosOrder",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelReason",
                table: "PosOrder",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelReasonType",
                table: "PosOrder");

            migrationBuilder.DropColumn(
                name: "CancelReason",
                table: "PosOrder");
        }
    }
}
