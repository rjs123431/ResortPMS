using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelIconsAndRatePlanChannels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Channel",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RoomRatePlanGroupChannel",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomRatePlanGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomRatePlanGroupChannel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomRatePlanGroupChannel_Channel_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomRatePlanGroupChannel_RoomRatePlanGroup_RoomRatePlanGroupId",
                        column: x => x.RoomRatePlanGroupId,
                        principalTable: "RoomRatePlanGroup",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomRatePlanGroupChannel_ChannelId",
                table: "RoomRatePlanGroupChannel",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomRatePlanGroupChannel_RoomRatePlanGroupId_ChannelId",
                table: "RoomRatePlanGroupChannel",
                columns: new[] { "RoomRatePlanGroupId", "ChannelId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoomRatePlanGroupChannel");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Channel");
        }
    }
}
