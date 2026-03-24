using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomMaintenanceTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "RoomMaintenanceRequest",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "RoomMaintenanceType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_RoomMaintenanceType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoomMaintenanceRequestType",
                columns: table => new
                {
                    RequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomMaintenanceRequestType", x => new { x.RequestId, x.TypeId });
                    table.ForeignKey(
                        name: "FK_RoomMaintenanceRequestType_RoomMaintenanceRequest_RequestId",
                        column: x => x.RequestId,
                        principalTable: "RoomMaintenanceRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoomMaintenanceRequestType_RoomMaintenanceType_TypeId",
                        column: x => x.TypeId,
                        principalTable: "RoomMaintenanceType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomMaintenanceRequest_Category",
                table: "RoomMaintenanceRequest",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_RoomMaintenanceRequestType_TypeId",
                table: "RoomMaintenanceRequestType",
                column: "TypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomMaintenanceType_Name",
                table: "RoomMaintenanceType",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoomMaintenanceRequestType");

            migrationBuilder.DropTable(
                name: "RoomMaintenanceType");

            migrationBuilder.DropIndex(
                name: "IX_RoomMaintenanceRequest_Category",
                table: "RoomMaintenanceRequest");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "RoomMaintenanceRequest");
        }
    }
}
