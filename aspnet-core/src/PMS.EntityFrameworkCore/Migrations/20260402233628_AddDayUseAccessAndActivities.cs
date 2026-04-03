using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class AddDayUseAccessAndActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DayUseOffer",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    VariantName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    OfferType = table.Column<int>(type: "int", nullable: false),
                    GuestContext = table.Column<int>(type: "int", nullable: false),
                    GuestCategory = table.Column<int>(type: "int", nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    ChargeTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayUseOffer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayUseOffer_ChargeType_ChargeTypeId",
                        column: x => x.ChargeTypeId,
                        principalTable: "ChargeType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DayUseVisit",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisitNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VisitDate = table.Column<DateTime>(type: "date", nullable: false),
                    AccessStartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    AccessEndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    GuestContext = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    BalanceAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
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
                    table.PrimaryKey("PK_DayUseVisit", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayUseVisit_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DayUseVisit_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DayUseVisit_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DayUsePayment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayUseVisitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceNo = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayUsePayment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayUsePayment_DayUseVisit_DayUseVisitId",
                        column: x => x.DayUseVisitId,
                        principalTable: "DayUseVisit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DayUsePayment_PaymentMethod_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethod",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DayUseVisitLine",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayUseVisitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayUseOfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChargeTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferType = table.Column<int>(type: "int", nullable: false),
                    GuestContext = table.Column<int>(type: "int", nullable: false),
                    GuestCategory = table.Column<int>(type: "int", nullable: true),
                    OfferCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    OfferName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    VariantName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayUseVisitLine", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayUseVisitLine_ChargeType_ChargeTypeId",
                        column: x => x.ChargeTypeId,
                        principalTable: "ChargeType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DayUseVisitLine_DayUseOffer_DayUseOfferId",
                        column: x => x.DayUseOfferId,
                        principalTable: "DayUseOffer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DayUseVisitLine_DayUseVisit_DayUseVisitId",
                        column: x => x.DayUseVisitId,
                        principalTable: "DayUseVisit",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DayUseOffer_ChargeTypeId",
                table: "DayUseOffer",
                column: "ChargeTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseOffer_Code",
                table: "DayUseOffer",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DayUseOffer_GuestContext_OfferType_SortOrder",
                table: "DayUseOffer",
                columns: new[] { "GuestContext", "OfferType", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_DayUsePayment_DayUseVisitId_PaidAt",
                table: "DayUsePayment",
                columns: new[] { "DayUseVisitId", "PaidAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DayUsePayment_PaymentMethodId",
                table: "DayUsePayment",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisit_GuestId",
                table: "DayUseVisit",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisit_RoomId",
                table: "DayUseVisit",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisit_StayId",
                table: "DayUseVisit",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisit_VisitDate_GuestContext",
                table: "DayUseVisit",
                columns: new[] { "VisitDate", "GuestContext" });

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisit_VisitNo",
                table: "DayUseVisit",
                column: "VisitNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisitLine_ChargeTypeId",
                table: "DayUseVisitLine",
                column: "ChargeTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisitLine_DayUseOfferId",
                table: "DayUseVisitLine",
                column: "DayUseOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_DayUseVisitLine_DayUseVisitId",
                table: "DayUseVisitLine",
                column: "DayUseVisitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DayUsePayment");

            migrationBuilder.DropTable(
                name: "DayUseVisitLine");

            migrationBuilder.DropTable(
                name: "DayUseOffer");

            migrationBuilder.DropTable(
                name: "DayUseVisit");
        }
    }
}
