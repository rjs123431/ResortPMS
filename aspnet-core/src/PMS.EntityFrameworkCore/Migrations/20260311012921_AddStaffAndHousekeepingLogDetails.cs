using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffAndHousekeepingLogDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NewStatus",
                table: "HousekeepingLog",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OldStatus",
                table: "HousekeepingLog",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "StaffId",
                table: "HousekeepingLog",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE [HousekeepingLog]
                SET [NewStatus] = CASE LOWER([Status])
                    WHEN 'clean' THEN 1
                    WHEN 'dirty' THEN 2
                    WHEN 'inspected' THEN 3
                    WHEN 'pickup' THEN 4
                    ELSE 2
                END,
                [OldStatus] = CASE LOWER([Status])
                    WHEN 'clean' THEN 1
                    WHEN 'dirty' THEN 2
                    WHEN 'inspected' THEN 3
                    WHEN 'pickup' THEN 4
                    ELSE 2
                END,
                [CreationTime] = CASE
                    WHEN [LoggedAt] IS NULL THEN [CreationTime]
                    ELSE [LoggedAt]
                END
            ");

            migrationBuilder.DropIndex(
                name: "IX_HousekeepingLog_RoomId_LoggedAt",
                table: "HousekeepingLog");

            migrationBuilder.DropColumn(
                name: "LoggedAt",
                table: "HousekeepingLog");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "HousekeepingLog");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "HousekeepingLog",
                newName: "Remarks");

            migrationBuilder.CreateTable(
                name: "Staff",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StaffCode = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Department = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Position = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    PhoneNumber = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staff", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_RoomId_CreationTime",
                table: "HousekeepingLog",
                columns: new[] { "RoomId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_StaffId",
                table: "HousekeepingLog",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_FullName",
                table: "Staff",
                column: "FullName");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_StaffCode",
                table: "Staff",
                column: "StaffCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_HousekeepingLog_Staff_StaffId",
                table: "HousekeepingLog",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HousekeepingLog_Staff_StaffId",
                table: "HousekeepingLog");

            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropIndex(
                name: "IX_HousekeepingLog_RoomId_CreationTime",
                table: "HousekeepingLog");

            migrationBuilder.DropIndex(
                name: "IX_HousekeepingLog_StaffId",
                table: "HousekeepingLog");

            migrationBuilder.DropColumn(
                name: "NewStatus",
                table: "HousekeepingLog");

            migrationBuilder.DropColumn(
                name: "OldStatus",
                table: "HousekeepingLog");

            migrationBuilder.DropColumn(
                name: "StaffId",
                table: "HousekeepingLog");

            migrationBuilder.RenameColumn(
                name: "Remarks",
                table: "HousekeepingLog",
                newName: "Notes");

            migrationBuilder.AddColumn<DateTime>(
                name: "LoggedAt",
                table: "HousekeepingLog",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "HousekeepingLog",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_RoomId_LoggedAt",
                table: "HousekeepingLog",
                columns: new[] { "RoomId", "LoggedAt" });
        }
    }
}
