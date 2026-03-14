using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomRatePlanCheckInCheckOutTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "CheckInTime",
                table: "RoomRatePlan",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 14, 0, 0, 0));

            migrationBuilder.AddColumn<TimeSpan>(
                name: "CheckOutTime",
                table: "RoomRatePlan",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 12, 0, 0, 0));

            // Normalize existing records: arrival/check-in 2 PM, departure/check-out 12 noon (cast to datetime2 so DATEADD hour works)
            migrationBuilder.Sql(@"
                UPDATE Reservation SET
                    ArrivalDate = DATEADD(hour, 14, CAST(CAST(ArrivalDate AS DATE) AS DATETIME2)),
                    DepartureDate = DATEADD(hour, 12, CAST(CAST(DepartureDate AS DATE) AS DATETIME2));
                UPDATE ReservationRoom SET
                    ArrivalDate = DATEADD(hour, 14, CAST(CAST(ArrivalDate AS DATE) AS DATETIME2)),
                    DepartureDate = DATEADD(hour, 12, CAST(CAST(DepartureDate AS DATE) AS DATETIME2));
                UPDATE ReservationExtraBed SET
                    ArrivalDate = DATEADD(hour, 14, CAST(CAST(ArrivalDate AS DATE) AS DATETIME2)),
                    DepartureDate = DATEADD(hour, 12, CAST(CAST(DepartureDate AS DATE) AS DATETIME2));
                UPDATE Stay SET
                    ExpectedCheckOutDateTime = DATEADD(hour, 12, CAST(CAST(ExpectedCheckOutDateTime AS DATE) AS DATETIME2));
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckInTime",
                table: "RoomRatePlan");

            migrationBuilder.DropColumn(
                name: "CheckOutTime",
                table: "RoomRatePlan");
        }
    }
}
