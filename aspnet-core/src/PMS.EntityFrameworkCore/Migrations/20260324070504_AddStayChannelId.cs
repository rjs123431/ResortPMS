using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddStayChannelId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ChannelId",
                table: "Stay",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stay_ChannelId",
                table: "Stay",
                column: "ChannelId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stay_Channel_ChannelId",
                table: "Stay",
                column: "ChannelId",
                principalTable: "Channel",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stay_Channel_ChannelId",
                table: "Stay");

            migrationBuilder.DropIndex(
                name: "IX_Stay_ChannelId",
                table: "Stay");

            migrationBuilder.DropColumn(
                name: "ChannelId",
                table: "Stay");
        }
    }
}
