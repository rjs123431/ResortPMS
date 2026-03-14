using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Migrations
{
    /// <inheritdoc />
    public partial class InitDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChargeType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Category = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    IsRoomCharge = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false),
                    RoomChargeType = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChargeType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentSequence",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Prefix = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    CurrentNumber = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSequence", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExtraBedType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExtraBedType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Guest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: true),
                    Email = table.Column<string>(type: "varchar(256)", unicode: false, maxLength: 256, nullable: true),
                    Phone = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    Nationality = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Guest", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuCategory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuCategory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemPromo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PromoName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DateFrom = table.Column<DateTime>(type: "date", nullable: false),
                    DateTo = table.Column<DateTime>(type: "date", nullable: false),
                    PercentageDiscount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemPromo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OptionGroup",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    MinSelections = table.Column<int>(type: "int", nullable: false),
                    MaxSelections = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OptionGroup", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentMethod",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentMethod", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoomType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    MaxAdults = table.Column<int>(type: "int", nullable: false),
                    MaxChildren = table.Column<int>(type: "int", nullable: false),
                    BaseRate = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomType", x => x.Id);
                });

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

            migrationBuilder.CreateTable(
                name: "ZzzAuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    ServiceName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    MethodName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Parameters = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    ReturnValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExecutionTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExecutionDuration = table.Column<int>(type: "int", nullable: false),
                    ClientIpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ClientName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    BrowserInfo = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ExceptionMessage = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    Exception = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ImpersonatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    ImpersonatorTenantId = table.Column<int>(type: "int", nullable: true),
                    CustomData = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzBackgroundJobs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobType = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    JobArgs = table.Column<string>(type: "nvarchar(max)", maxLength: 1048576, nullable: false),
                    TryCount = table.Column<short>(type: "smallint", nullable: false),
                    NextTryTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastTryTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsAbandoned = table.Column<bool>(type: "bit", nullable: false),
                    Priority = table.Column<byte>(type: "tinyint", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzBackgroundJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzBinaryObjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    Bytes = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    FileType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Source = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzBinaryObjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzDynamicProperties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InputType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Permission = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzDynamicProperties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzEditions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
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
                    table.PrimaryKey("PK_ZzzEditions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzEntityChangeSets",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BrowserInfo = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ClientIpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ClientName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExtensionData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImpersonatorTenantId = table.Column<int>(type: "int", nullable: true),
                    ImpersonatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzEntityChangeSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzGlobalNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Message = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzGlobalNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzLanguages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    IsDisabled = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_ZzzLanguages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzLanguageTexts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    LanguageName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Key = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", maxLength: 67108864, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzLanguageTexts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NotificationName = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: false),
                    Data = table.Column<string>(type: "nvarchar(max)", maxLength: 1048576, nullable: true),
                    DataTypeName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    EntityTypeName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    EntityTypeAssemblyQualifiedName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    EntityId = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: true),
                    Severity = table.Column<byte>(type: "tinyint", nullable: false),
                    UserIds = table.Column<string>(type: "nvarchar(max)", maxLength: 131072, nullable: true),
                    ExcludedUserIds = table.Column<string>(type: "nvarchar(max)", maxLength: 131072, nullable: true),
                    TenantIds = table.Column<string>(type: "nvarchar(max)", maxLength: 131072, nullable: true),
                    TargetNotifiers = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzNotificationSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    NotificationName = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: true),
                    EntityTypeName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    EntityTypeAssemblyQualifiedName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    EntityId = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: true),
                    TargetNotifiers = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzNotificationSubscriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzOrganizationUnitRoles",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    OrganizationUnitId = table.Column<long>(type: "bigint", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzOrganizationUnitRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzOrganizationUnits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(95)", maxLength: 95, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
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
                    table.PrimaryKey("PK_ZzzOrganizationUnits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzOrganizationUnits_ZzzOrganizationUnits_ParentId",
                        column: x => x.ParentId,
                        principalTable: "ZzzOrganizationUnits",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ZzzTenantNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    NotificationName = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: false),
                    Data = table.Column<string>(type: "nvarchar(max)", maxLength: 1048576, nullable: true),
                    DataTypeName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    EntityTypeName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    EntityTypeAssemblyQualifiedName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    EntityId = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: true),
                    Severity = table.Column<byte>(type: "tinyint", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzTenantNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserAccounts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    UserLinkId = table.Column<long>(type: "bigint", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
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
                    table.PrimaryKey("PK_ZzzUserAccounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserLoginAttempts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    TenancyName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    UserNameOrEmailAddress = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ClientIpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ClientName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    BrowserInfo = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    Result = table.Column<byte>(type: "tinyint", nullable: false),
                    FailReason = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserLoginAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    TenantNotificationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    State = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TargetNotifiers = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserOrganizationUnits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    OrganizationUnitId = table.Column<long>(type: "bigint", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserOrganizationUnits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUsers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccessAnywhere = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AuthenticationSource = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Surname = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Password = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    EmailConfirmationCode = table.Column<string>(type: "nvarchar(328)", maxLength: 328, nullable: true),
                    PasswordResetCode = table.Column<string>(type: "nvarchar(328)", maxLength: 328, nullable: true),
                    LockoutEndDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false),
                    IsLockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    IsPhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    SecurityStamp = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    IsTwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    IsEmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    NormalizedEmailAddress = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzUsers_ZzzUsers_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzUsers_ZzzUsers_DeleterUserId",
                        column: x => x.DeleterUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzUsers_ZzzUsers_LastModifierUserId",
                        column: x => x.LastModifierUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ZzzWebhookEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WebhookName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Data = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzWebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZzzWebhookSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    WebhookUri = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Secret = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Webhooks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Headers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzWebhookSubscriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PosOutlet",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    HasKitchen = table.Column<bool>(type: "bit", nullable: false),
                    ChargeTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RoomServiceChargeType = table.Column<int>(type: "int", nullable: false),
                    RoomServiceChargePercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    RoomServiceChargeAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ServiceChargeType = table.Column<int>(type: "int", nullable: false),
                    ServiceChargePercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ServiceChargeFixedAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PosOutlet", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOutlet_ChargeType_ChargeTypeId",
                        column: x => x.ChargeTypeId,
                        principalTable: "ChargeType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "GuestIdentification",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdentificationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IdentificationNumber = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IssuedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuestIdentification", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestIdentification_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Quotation",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuotationNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    QuotationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Nights = table.Column<int>(type: "int", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    SpecialRequests = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Phone = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
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
                    table.PrimaryKey("PK_Quotation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quotation_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reservation",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReservationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Nights = table.Column<int>(type: "int", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DepositPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    DepositRequired = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DepositPaid = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    ReservationConditions = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    SpecialRequests = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Phone = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
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
                    table.PrimaryKey("PK_Reservation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reservation_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItem_MenuCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MenuCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosOption",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    PriceAdjustment = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PosOption", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOption_OptionGroup_OptionGroupId",
                        column: x => x.OptionGroupId,
                        principalTable: "OptionGroup",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Room",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomNumber = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: false),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Floor = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    OperationalStatus = table.Column<int>(type: "int", nullable: false),
                    HousekeepingStatus = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Room", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Room_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomRatePlan",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    StartDate = table.Column<DateTime>(type: "date", nullable: false),
                    EndDate = table.Column<DateTime>(type: "date", nullable: true),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CheckInTime = table.Column<TimeSpan>(type: "time", nullable: false, defaultValue: new TimeSpan(0, 14, 0, 0, 0)),
                    CheckOutTime = table.Column<TimeSpan>(type: "time", nullable: false, defaultValue: new TimeSpan(0, 12, 0, 0, 0)),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomRatePlan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomRatePlan_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ZzzDynamicEntityProperties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityFullName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    DynamicPropertyId = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzDynamicEntityProperties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzDynamicEntityProperties_ZzzDynamicProperties_DynamicPropertyId",
                        column: x => x.DynamicPropertyId,
                        principalTable: "ZzzDynamicProperties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzDynamicPropertyValues",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    DynamicPropertyId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzDynamicPropertyValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzDynamicPropertyValues_ZzzDynamicProperties_DynamicPropertyId",
                        column: x => x.DynamicPropertyId,
                        principalTable: "ZzzDynamicProperties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzFeatures",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Discriminator = table.Column<string>(type: "nvarchar(21)", maxLength: 21, nullable: false),
                    EditionId = table.Column<int>(type: "int", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzFeatures_ZzzEditions_EditionId",
                        column: x => x.EditionId,
                        principalTable: "ZzzEditions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzEntityChanges",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChangeTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangeType = table.Column<byte>(type: "tinyint", nullable: false),
                    EntityChangeSetId = table.Column<long>(type: "bigint", nullable: false),
                    EntityId = table.Column<string>(type: "nvarchar(48)", maxLength: 48, nullable: true),
                    EntityTypeFullName = table.Column<string>(type: "nvarchar(192)", maxLength: 192, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzEntityChanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzEntityChanges_ZzzEntityChangeSets_EntityChangeSetId",
                        column: x => x.EntityChangeSetId,
                        principalTable: "ZzzEntityChangeSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IsStatic = table.Column<bool>(type: "bit", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzRoles_ZzzUsers_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzRoles_ZzzUsers_DeleterUserId",
                        column: x => x.DeleterUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzRoles_ZzzUsers_LastModifierUserId",
                        column: x => x.LastModifierUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ZzzSettings",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzSettings_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ZzzTenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenancyName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ConnectionString = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EditionId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzTenants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzTenants_ZzzEditions_EditionId",
                        column: x => x.EditionId,
                        principalTable: "ZzzEditions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzTenants_ZzzUsers_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzTenants_ZzzUsers_DeleterUserId",
                        column: x => x.DeleterUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ZzzTenants_ZzzUsers_LastModifierUserId",
                        column: x => x.LastModifierUserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserClaims",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzUserClaims_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserLogins",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserLogins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzUserLogins_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserRoles",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzUserRoles_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzUserTokens",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Value = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ExpireDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzUserTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzUserTokens_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzWebhookSendAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WebhookEventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WebhookSubscriptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Response = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResponseStatusCode = table.Column<int>(type: "int", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzWebhookSendAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzWebhookSendAttempts_ZzzWebhookEvents_WebhookEventId",
                        column: x => x.WebhookEventId,
                        principalTable: "ZzzWebhookEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PosOutletTerminal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OutletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PosOutletTerminal", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOutletTerminal_PosOutlet_OutletId",
                        column: x => x.OutletId,
                        principalTable: "PosOutlet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosSession",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OutletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TerminalId = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OpeningCash = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ClosingCash = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    ExpectedCash = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    CashDifference = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_PosSession", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosSession_PosOutlet_OutletId",
                        column: x => x.OutletId,
                        principalTable: "PosOutlet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosTable",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OutletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TableNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PosTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosTable_PosOutlet_OutletId",
                        column: x => x.OutletId,
                        principalTable: "PosOutlet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuotationExtraBed",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraBedTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ExtraBedTypeName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationExtraBed", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationExtraBed_ExtraBedType_ExtraBedTypeId",
                        column: x => x.ExtraBedTypeId,
                        principalTable: "ExtraBedType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuotationExtraBed_Quotation_QuotationId",
                        column: x => x.QuotationId,
                        principalTable: "Quotation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreCheckIn",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreCheckInNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PreCheckInDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivalDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Nights = table.Column<int>(type: "int", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    SpecialRequests = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Phone = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
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
                    table.PrimaryKey("PK_PreCheckIn", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreCheckIn_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PreCheckIn_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReservationDeposit",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaidDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceNo = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
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
                    table.PrimaryKey("PK_ReservationDeposit", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationDeposit_PaymentMethod_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethod",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationDeposit_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReservationExtraBed",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraBedTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ArrivalDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SeniorCitizenCount = table.Column<int>(type: "int", nullable: false),
                    SeniorCitizenPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 20m),
                    SeniorCitizenDiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReservationExtraBed", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationExtraBed_ExtraBedType_ExtraBedTypeId",
                        column: x => x.ExtraBedTypeId,
                        principalTable: "ExtraBedType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationExtraBed_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReservationGuest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Age = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReservationGuest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationGuest_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationGuest_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemPriceAdjustment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NewPrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "date", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemPriceAdjustment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemPriceAdjustment_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemPromoItem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemPromoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemPromoItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemPromoItem_MenuItemPromo_MenuItemPromoId",
                        column: x => x.MenuItemPromoId,
                        principalTable: "MenuItemPromo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuItemPromoItem_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuModifier",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    PriceAdjustment = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuModifier", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuModifier_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemOptionGroup",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    DefaultOptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemOptionGroup", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemOptionGroup_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuItemOptionGroup_OptionGroup_OptionGroupId",
                        column: x => x.OptionGroupId,
                        principalTable: "OptionGroup",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MenuItemOptionGroup_PosOption_DefaultOptionId",
                        column: x => x.DefaultOptionId,
                        principalTable: "PosOption",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemOptionPriceOverride",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PriceAdjustment = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemOptionPriceOverride", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemOptionPriceOverride_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuItemOptionPriceOverride_PosOption_OptionId",
                        column: x => x.OptionId,
                        principalTable: "PosOption",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuotationRoom",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SeniorCitizenCount = table.Column<int>(type: "int", nullable: false),
                    SeniorCitizenDiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    RoomTypeName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    RoomNumber = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationRoom", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationRoom_Quotation_QuotationId",
                        column: x => x.QuotationId,
                        principalTable: "Quotation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuotationRoom_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuotationRoom_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReservationRoom",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ArrivalDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SeniorCitizenCount = table.Column<int>(type: "int", nullable: false),
                    SeniorCitizenPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 20m),
                    SeniorCitizenDiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    RoomTypeName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    RoomNumber = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReservationRoom", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationRoom_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationRoom_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReservationRoom_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomStatusLog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OperationalStatus = table.Column<int>(type: "int", nullable: true),
                    HousekeepingStatus = table.Column<int>(type: "int", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomStatusLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomStatusLog_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Stay",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CheckInDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedCheckOutDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActualCheckOutDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    FirstName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Phone = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AssignedRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
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
                    table.PrimaryKey("PK_Stay", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stay_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Stay_Reservation_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Stay_Room_AssignedRoomId",
                        column: x => x.AssignedRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RatePlanDateOverride",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomRatePlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RateDate = table.Column<DateTime>(type: "date", nullable: false),
                    OverridePrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RatePlanDateOverride", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RatePlanDateOverride_RoomRatePlan_RoomRatePlanId",
                        column: x => x.RoomRatePlanId,
                        principalTable: "RoomRatePlan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomRatePlanDay",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomRatePlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomRatePlanDay", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomRatePlanDay_RoomRatePlan_RoomRatePlanId",
                        column: x => x.RoomRatePlanId,
                        principalTable: "RoomRatePlan",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzDynamicEntityPropertyValues",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EntityId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DynamicEntityPropertyId = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzDynamicEntityPropertyValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzDynamicEntityPropertyValues_ZzzDynamicEntityProperties_DynamicEntityPropertyId",
                        column: x => x.DynamicEntityPropertyId,
                        principalTable: "ZzzDynamicEntityProperties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzEntityPropertyChanges",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityChangeId = table.Column<long>(type: "bigint", nullable: false),
                    NewValue = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    OriginalValue = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    PropertyName = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: true),
                    PropertyTypeFullName = table.Column<string>(type: "nvarchar(192)", maxLength: 192, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    NewValueHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OriginalValueHash = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzEntityPropertyChanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzEntityPropertyChanges_ZzzEntityChanges_EntityChangeId",
                        column: x => x.EntityChangeId,
                        principalTable: "ZzzEntityChanges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzPermissions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IsGranted = table.Column<bool>(type: "bit", nullable: false),
                    Discriminator = table.Column<string>(type: "nvarchar(21)", maxLength: 21, nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzPermissions_ZzzRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "ZzzRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ZzzPermissions_ZzzUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ZzzUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZzzRoleClaims",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: true),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZzzRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZzzRoleClaims_ZzzRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "ZzzRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreCheckInExtraBed",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreCheckInId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExtraBedTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ExtraBedTypeName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreCheckInExtraBed", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreCheckInExtraBed_ExtraBedType_ExtraBedTypeId",
                        column: x => x.ExtraBedTypeId,
                        principalTable: "ExtraBedType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PreCheckInExtraBed_PreCheckIn_PreCheckInId",
                        column: x => x.PreCheckInId,
                        principalTable: "PreCheckIn",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreCheckInRoom",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreCheckInId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RatePerNight = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NumberOfNights = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SeniorCitizenCount = table.Column<int>(type: "int", nullable: false),
                    SeniorCitizenDiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    RoomTypeName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    RoomNumber = table.Column<string>(type: "varchar(16)", unicode: false, maxLength: 16, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreCheckInRoom", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreCheckInRoom_PreCheckIn_PreCheckInId",
                        column: x => x.PreCheckInId,
                        principalTable: "PreCheckIn",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PreCheckInRoom_ReservationRoom_ReservationRoomId",
                        column: x => x.ReservationRoomId,
                        principalTable: "ReservationRoom",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PreCheckInRoom_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PreCheckInRoom_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReservationDailyRate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Tax = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReservationDailyRate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReservationDailyRate_ReservationRoom_ReservationRoomId",
                        column: x => x.ReservationRoomId,
                        principalTable: "ReservationRoom",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CheckOutRecord",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CheckOutDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalCharges = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalPayments = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalDiscounts = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    BalanceDue = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SettledAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
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
                    table.PrimaryKey("PK_CheckOutRecord", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckOutRecord_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Folio",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FolioNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
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
                    table.PrimaryKey("PK_Folio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Folio_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GuestRequest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestTypes = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    Status = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
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
                    table.PrimaryKey("PK_GuestRequest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestRequest_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Incident",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    ReportedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Resolution = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
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
                    table.PrimaryKey("PK_Incident", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incident_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosOrder",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OutletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PosTerminalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TableId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GuestName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    OrderNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    OrderType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ServerStaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DiscountPercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    SeniorCitizenDiscount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelReasonType = table.Column<int>(type: "int", nullable: true),
                    CancelReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RoomServiceChargeType = table.Column<int>(type: "int", nullable: false),
                    RoomServiceChargePercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    RoomServiceChargeAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ServiceChargeType = table.Column<int>(type: "int", nullable: false),
                    ServiceChargePercent = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ServiceChargeAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
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
                    table.PrimaryKey("PK_PosOrder", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOrder_PosOutletTerminal_PosTerminalId",
                        column: x => x.PosTerminalId,
                        principalTable: "PosOutletTerminal",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PosOrder_PosOutlet_OutletId",
                        column: x => x.OutletId,
                        principalTable: "PosOutlet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PosOrder_PosTable_TableId",
                        column: x => x.TableId,
                        principalTable: "PosTable",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PosOrder_Staff_ServerStaffId",
                        column: x => x.ServerStaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PosOrder_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Receipt",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReceiptNo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    IssuedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
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
                    table.PrimaryKey("PK_Receipt", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Receipt_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomTransfer",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransferDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_RoomTransfer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomTransfer_Room_FromRoomId",
                        column: x => x.FromRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomTransfer_Room_ToRoomId",
                        column: x => x.ToRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomTransfer_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StayExtension",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OldDepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NewDepartureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_StayExtension", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StayExtension_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StayGuest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StayGuest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StayGuest_Guest_GuestId",
                        column: x => x.GuestId,
                        principalTable: "Guest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayGuest_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StayRoom",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsCleared = table.Column<bool>(type: "bit", nullable: false),
                    ClearedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClearedByStaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OriginalRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StayRoom", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StayRoom_RoomType_OriginalRoomTypeId",
                        column: x => x.OriginalRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoom_RoomType_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoom_Room_OriginalRoomId",
                        column: x => x.OriginalRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoom_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoom_Staff_ClearedByStaffId",
                        column: x => x.ClearedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoom_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FolioAdjustment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FolioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdjustmentType = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
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
                    table.PrimaryKey("PK_FolioAdjustment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FolioAdjustment_Folio_FolioId",
                        column: x => x.FolioId,
                        principalTable: "Folio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FolioPayment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FolioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PaidDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceNo = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IsVoided = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    VoidReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_FolioPayment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FolioPayment_Folio_FolioId",
                        column: x => x.FolioId,
                        principalTable: "Folio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FolioPayment_PaymentMethod_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethod",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FolioTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FolioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TransactionType = table.Column<int>(type: "int", nullable: false),
                    ChargeTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NetAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    IsVoided = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    VoidReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_FolioTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FolioTransaction_ChargeType_ChargeTypeId",
                        column: x => x.ChargeTypeId,
                        principalTable: "ChargeType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FolioTransaction_Folio_FolioId",
                        column: x => x.FolioId,
                        principalTable: "Folio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HousekeepingTask",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TaskType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AssignedToStaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    TaskDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HousekeepingTask", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HousekeepingTask_GuestRequest_GuestRequestId",
                        column: x => x.GuestRequestId,
                        principalTable: "GuestRequest",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_HousekeepingTask_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HousekeepingTask_Staff_AssignedToStaffId",
                        column: x => x.AssignedToStaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosOrderItem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PosOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    OriginalPrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CancelReasonType = table.Column<int>(type: "int", nullable: true),
                    CancelReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_PosOrderItem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOrderItem_MenuItem_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PosOrderItem_PosOrder_PosOrderId",
                        column: x => x.PosOrderId,
                        principalTable: "PosOrder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosOrderPayment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PosOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReferenceNo = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
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
                    table.PrimaryKey("PK_PosOrderPayment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOrderPayment_PaymentMethod_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethod",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PosOrderPayment_PosOrder_PosOrderId",
                        column: x => x.PosOrderId,
                        principalTable: "PosOrder",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReceiptPayment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReceiptId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentMethodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceiptPayment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReceiptPayment_PaymentMethod_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethod",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReceiptPayment_Receipt_ReceiptId",
                        column: x => x.ReceiptId,
                        principalTable: "Receipt",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomChangeRequest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Source = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<int>(type: "int", nullable: false),
                    ReasonDetails = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    FromRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreferredRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ToRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ToRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RequestedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
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
                    table.PrimaryKey("PK_RoomChangeRequest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_RoomType_FromRoomTypeId",
                        column: x => x.FromRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_RoomType_PreferredRoomTypeId",
                        column: x => x.PreferredRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_RoomType_ToRoomTypeId",
                        column: x => x.ToRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_Room_FromRoomId",
                        column: x => x.FromRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_Room_ToRoomId",
                        column: x => x.ToRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_StayRoom_StayRoomId",
                        column: x => x.StayRoomId,
                        principalTable: "StayRoom",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomChangeRequest_Stay_StayId",
                        column: x => x.StayId,
                        principalTable: "Stay",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StayRoomTransfer",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StayRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToRoomTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToRoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransferredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StayRoomTransfer", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StayRoomTransfer_RoomType_FromRoomTypeId",
                        column: x => x.FromRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoomTransfer_RoomType_ToRoomTypeId",
                        column: x => x.ToRoomTypeId,
                        principalTable: "RoomType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoomTransfer_Room_FromRoomId",
                        column: x => x.FromRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoomTransfer_Room_ToRoomId",
                        column: x => x.ToRoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StayRoomTransfer_StayRoom_StayRoomId",
                        column: x => x.StayRoomId,
                        principalTable: "StayRoom",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HousekeepingLog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OldStatus = table.Column<int>(type: "int", nullable: false),
                    NewStatus = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HousekeepingTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CheckOutRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HousekeepingLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HousekeepingLog_CheckOutRecord_CheckOutRecordId",
                        column: x => x.CheckOutRecordId,
                        principalTable: "CheckOutRecord",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HousekeepingLog_HousekeepingTask_HousekeepingTaskId",
                        column: x => x.HousekeepingTaskId,
                        principalTable: "HousekeepingTask",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HousekeepingLog_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HousekeepingLog_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosOrderItemOption",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PosOrderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_PosOrderItemOption", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosOrderItemOption_PosOption_OptionId",
                        column: x => x.OptionId,
                        principalTable: "PosOption",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PosOrderItemOption_PosOrderItem_PosOrderItemId",
                        column: x => x.PosOrderItemId,
                        principalTable: "PosOrderItem",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChargeType_Name",
                table: "ChargeType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckOutRecord_StayId",
                table: "CheckOutRecord",
                column: "StayId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSequence_DocumentType_Year_TenantId",
                table: "DocumentSequence",
                columns: new[] { "DocumentType", "Year", "TenantId" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ExtraBedType_Name",
                table: "ExtraBedType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Folio_FolioNo",
                table: "Folio",
                column: "FolioNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Folio_StayId",
                table: "Folio",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_FolioAdjustment_FolioId",
                table: "FolioAdjustment",
                column: "FolioId");

            migrationBuilder.CreateIndex(
                name: "IX_FolioPayment_FolioId_PaidDate",
                table: "FolioPayment",
                columns: new[] { "FolioId", "PaidDate" });

            migrationBuilder.CreateIndex(
                name: "IX_FolioPayment_PaymentMethodId",
                table: "FolioPayment",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_FolioTransaction_ChargeTypeId",
                table: "FolioTransaction",
                column: "ChargeTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_FolioTransaction_FolioId_TransactionDate",
                table: "FolioTransaction",
                columns: new[] { "FolioId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Guest_GuestCode",
                table: "Guest",
                column: "GuestCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuestIdentification_GuestId",
                table: "GuestIdentification",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_GuestRequest_StayId",
                table: "GuestRequest",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_CheckOutRecordId",
                table: "HousekeepingLog",
                column: "CheckOutRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_HousekeepingTaskId",
                table: "HousekeepingLog",
                column: "HousekeepingTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_RoomId_CreationTime",
                table: "HousekeepingLog",
                columns: new[] { "RoomId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingLog_StaffId",
                table: "HousekeepingLog",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTask_AssignedToStaffId",
                table: "HousekeepingTask",
                column: "AssignedToStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTask_GuestRequestId",
                table: "HousekeepingTask",
                column: "GuestRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTask_RoomId_TaskDate",
                table: "HousekeepingTask",
                columns: new[] { "RoomId", "TaskDate" });

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTask_Status",
                table: "HousekeepingTask",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Incident_StayId",
                table: "Incident",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuCategory_DisplayOrder",
                table: "MenuCategory",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItem_CategoryId",
                table: "MenuItem",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemOptionGroup_DefaultOptionId",
                table: "MenuItemOptionGroup",
                column: "DefaultOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemOptionGroup_MenuItemId_OptionGroupId",
                table: "MenuItemOptionGroup",
                columns: new[] { "MenuItemId", "OptionGroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemOptionGroup_OptionGroupId",
                table: "MenuItemOptionGroup",
                column: "OptionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemOptionPriceOverride_MenuItemId_OptionId",
                table: "MenuItemOptionPriceOverride",
                columns: new[] { "MenuItemId", "OptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemOptionPriceOverride_OptionId",
                table: "MenuItemOptionPriceOverride",
                column: "OptionId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPriceAdjustment_MenuItemId_EffectiveDate",
                table: "MenuItemPriceAdjustment",
                columns: new[] { "MenuItemId", "EffectiveDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPromo_DateFrom_DateTo",
                table: "MenuItemPromo",
                columns: new[] { "DateFrom", "DateTo" });

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPromoItem_MenuItemId",
                table: "MenuItemPromoItem",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPromoItem_MenuItemPromoId_MenuItemId",
                table: "MenuItemPromoItem",
                columns: new[] { "MenuItemPromoId", "MenuItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuModifier_MenuItemId",
                table: "MenuModifier",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_OptionGroup_DisplayOrder",
                table: "OptionGroup",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentMethod_Name",
                table: "PaymentMethod",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PosOption_OptionGroupId",
                table: "PosOption",
                column: "OptionGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_OrderNumber",
                table: "PosOrder",
                column: "OrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_OutletId_Status",
                table: "PosOrder",
                columns: new[] { "OutletId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_PosTerminalId",
                table: "PosOrder",
                column: "PosTerminalId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_ServerStaffId",
                table: "PosOrder",
                column: "ServerStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_StayId",
                table: "PosOrder",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrder_TableId",
                table: "PosOrder",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderItem_MenuItemId",
                table: "PosOrderItem",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderItem_PosOrderId",
                table: "PosOrderItem",
                column: "PosOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderItemOption_OptionId",
                table: "PosOrderItemOption",
                column: "OptionId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderItemOption_PosOrderItemId",
                table: "PosOrderItemOption",
                column: "PosOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderPayment_PaymentMethodId",
                table: "PosOrderPayment",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOrderPayment_PosOrderId",
                table: "PosOrderPayment",
                column: "PosOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOutlet_ChargeTypeId",
                table: "PosOutlet",
                column: "ChargeTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PosOutlet_Name",
                table: "PosOutlet",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_PosOutletTerminal_OutletId_Code",
                table: "PosOutletTerminal",
                columns: new[] { "OutletId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PosSession_OutletId",
                table: "PosSession",
                column: "OutletId");

            migrationBuilder.CreateIndex(
                name: "IX_PosSession_UserId_Status",
                table: "PosSession",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PosTable_OutletId_TableNumber",
                table: "PosTable",
                columns: new[] { "OutletId", "TableNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckIn_ExpiresAt",
                table: "PreCheckIn",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckIn_GuestId",
                table: "PreCheckIn",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckIn_PreCheckInNo",
                table: "PreCheckIn",
                column: "PreCheckInNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckIn_ReservationId",
                table: "PreCheckIn",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckIn_Status",
                table: "PreCheckIn",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInExtraBed_ExtraBedTypeId",
                table: "PreCheckInExtraBed",
                column: "ExtraBedTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInExtraBed_PreCheckInId",
                table: "PreCheckInExtraBed",
                column: "PreCheckInId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInRoom_PreCheckInId",
                table: "PreCheckInRoom",
                column: "PreCheckInId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInRoom_ReservationRoomId",
                table: "PreCheckInRoom",
                column: "ReservationRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInRoom_RoomId",
                table: "PreCheckInRoom",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_PreCheckInRoom_RoomTypeId",
                table: "PreCheckInRoom",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotation_ExpiresAt",
                table: "Quotation",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Quotation_GuestId",
                table: "Quotation",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotation_QuotationNo",
                table: "Quotation",
                column: "QuotationNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotation_Status",
                table: "Quotation",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationExtraBed_ExtraBedTypeId",
                table: "QuotationExtraBed",
                column: "ExtraBedTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationExtraBed_QuotationId",
                table: "QuotationExtraBed",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRoom_QuotationId",
                table: "QuotationRoom",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRoom_RoomId",
                table: "QuotationRoom",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRoom_RoomTypeId",
                table: "QuotationRoom",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RatePlanDateOverride_RoomRatePlanId_RateDate",
                table: "RatePlanDateOverride",
                columns: new[] { "RoomRatePlanId", "RateDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_ReceiptNo",
                table: "Receipt",
                column: "ReceiptNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_StayId",
                table: "Receipt",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptPayment_PaymentMethodId",
                table: "ReceiptPayment",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptPayment_ReceiptId",
                table: "ReceiptPayment",
                column: "ReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_GuestId_ArrivalDate",
                table: "Reservation",
                columns: new[] { "GuestId", "ArrivalDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_ReservationNo",
                table: "Reservation",
                column: "ReservationNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_Status",
                table: "Reservation",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationDailyRate_ReservationRoomId",
                table: "ReservationDailyRate",
                column: "ReservationRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationDeposit_PaymentMethodId",
                table: "ReservationDeposit",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationDeposit_ReservationId",
                table: "ReservationDeposit",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationExtraBed_ExtraBedTypeId",
                table: "ReservationExtraBed",
                column: "ExtraBedTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationExtraBed_ReservationId",
                table: "ReservationExtraBed",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationGuest_GuestId",
                table: "ReservationGuest",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationGuest_ReservationId",
                table: "ReservationGuest",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationRoom_ReservationId",
                table: "ReservationRoom",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationRoom_RoomId",
                table: "ReservationRoom",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ReservationRoom_RoomTypeId",
                table: "ReservationRoom",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Room_RoomNumber",
                table: "Room",
                column: "RoomNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Room_RoomTypeId",
                table: "Room",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_FromRoomId",
                table: "RoomChangeRequest",
                column: "FromRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_FromRoomTypeId",
                table: "RoomChangeRequest",
                column: "FromRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_PreferredRoomTypeId",
                table: "RoomChangeRequest",
                column: "PreferredRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_RequestedAt",
                table: "RoomChangeRequest",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_Status",
                table: "RoomChangeRequest",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_StayId",
                table: "RoomChangeRequest",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_StayRoomId",
                table: "RoomChangeRequest",
                column: "StayRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_ToRoomId",
                table: "RoomChangeRequest",
                column: "ToRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomChangeRequest_ToRoomTypeId",
                table: "RoomChangeRequest",
                column: "ToRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomRatePlan_RoomTypeId_Code",
                table: "RoomRatePlan",
                columns: new[] { "RoomTypeId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomRatePlanDay_RoomRatePlanId_DayOfWeek",
                table: "RoomRatePlanDay",
                columns: new[] { "RoomRatePlanId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomStatusLog_RoomId_ChangedAt",
                table: "RoomStatusLog",
                columns: new[] { "RoomId", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomTransfer_FromRoomId",
                table: "RoomTransfer",
                column: "FromRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomTransfer_StayId",
                table: "RoomTransfer",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomTransfer_ToRoomId",
                table: "RoomTransfer",
                column: "ToRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomType_Name",
                table: "RoomType",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Staff_FullName",
                table: "Staff",
                column: "FullName");

            migrationBuilder.CreateIndex(
                name: "IX_Staff_StaffCode",
                table: "Staff",
                column: "StaffCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stay_AssignedRoomId",
                table: "Stay",
                column: "AssignedRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Stay_GuestId",
                table: "Stay",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_Stay_ReservationId",
                table: "Stay",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_Stay_Status",
                table: "Stay",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Stay_StayNo",
                table: "Stay",
                column: "StayNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StayExtension_StayId",
                table: "StayExtension",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_StayGuest_GuestId",
                table: "StayGuest",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_StayGuest_StayId",
                table: "StayGuest",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_ClearedByStaffId",
                table: "StayRoom",
                column: "ClearedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_OriginalRoomId",
                table: "StayRoom",
                column: "OriginalRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_OriginalRoomTypeId",
                table: "StayRoom",
                column: "OriginalRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_RoomId",
                table: "StayRoom",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_RoomTypeId",
                table: "StayRoom",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoom_StayId",
                table: "StayRoom",
                column: "StayId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoomTransfer_FromRoomId",
                table: "StayRoomTransfer",
                column: "FromRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoomTransfer_FromRoomTypeId",
                table: "StayRoomTransfer",
                column: "FromRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoomTransfer_StayRoomId",
                table: "StayRoomTransfer",
                column: "StayRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoomTransfer_ToRoomId",
                table: "StayRoomTransfer",
                column: "ToRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_StayRoomTransfer_ToRoomTypeId",
                table: "StayRoomTransfer",
                column: "ToRoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzAuditLogs_TenantId_ExecutionDuration",
                table: "ZzzAuditLogs",
                columns: new[] { "TenantId", "ExecutionDuration" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzAuditLogs_TenantId_ExecutionTime",
                table: "ZzzAuditLogs",
                columns: new[] { "TenantId", "ExecutionTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzAuditLogs_TenantId_UserId",
                table: "ZzzAuditLogs",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzBackgroundJobs_IsAbandoned_NextTryTime",
                table: "ZzzBackgroundJobs",
                columns: new[] { "IsAbandoned", "NextTryTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzBinaryObjects_TenantId",
                table: "ZzzBinaryObjects",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzDynamicEntityProperties_DynamicPropertyId",
                table: "ZzzDynamicEntityProperties",
                column: "DynamicPropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzDynamicEntityProperties_EntityFullName_DynamicPropertyId_TenantId",
                table: "ZzzDynamicEntityProperties",
                columns: new[] { "EntityFullName", "DynamicPropertyId", "TenantId" },
                unique: true,
                filter: "[EntityFullName] IS NOT NULL AND [TenantId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzDynamicEntityPropertyValues_DynamicEntityPropertyId",
                table: "ZzzDynamicEntityPropertyValues",
                column: "DynamicEntityPropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzDynamicProperties_PropertyName_TenantId",
                table: "ZzzDynamicProperties",
                columns: new[] { "PropertyName", "TenantId" },
                unique: true,
                filter: "[PropertyName] IS NOT NULL AND [TenantId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzDynamicPropertyValues_DynamicPropertyId",
                table: "ZzzDynamicPropertyValues",
                column: "DynamicPropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityChanges_EntityChangeSetId",
                table: "ZzzEntityChanges",
                column: "EntityChangeSetId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityChanges_EntityTypeFullName_EntityId",
                table: "ZzzEntityChanges",
                columns: new[] { "EntityTypeFullName", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityChangeSets_TenantId_CreationTime",
                table: "ZzzEntityChangeSets",
                columns: new[] { "TenantId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityChangeSets_TenantId_Reason",
                table: "ZzzEntityChangeSets",
                columns: new[] { "TenantId", "Reason" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityChangeSets_TenantId_UserId",
                table: "ZzzEntityChangeSets",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzEntityPropertyChanges_EntityChangeId",
                table: "ZzzEntityPropertyChanges",
                column: "EntityChangeId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzFeatures_EditionId_Name",
                table: "ZzzFeatures",
                columns: new[] { "EditionId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzFeatures_TenantId_Name",
                table: "ZzzFeatures",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzLanguages_TenantId_Name",
                table: "ZzzLanguages",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzLanguageTexts_TenantId_Source_LanguageName_Key",
                table: "ZzzLanguageTexts",
                columns: new[] { "TenantId", "Source", "LanguageName", "Key" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzNotificationSubscriptions_NotificationName_EntityTypeName_EntityId_UserId",
                table: "ZzzNotificationSubscriptions",
                columns: new[] { "NotificationName", "EntityTypeName", "EntityId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzNotificationSubscriptions_TenantId_NotificationName_EntityTypeName_EntityId_UserId",
                table: "ZzzNotificationSubscriptions",
                columns: new[] { "TenantId", "NotificationName", "EntityTypeName", "EntityId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzOrganizationUnitRoles_TenantId_OrganizationUnitId",
                table: "ZzzOrganizationUnitRoles",
                columns: new[] { "TenantId", "OrganizationUnitId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzOrganizationUnitRoles_TenantId_RoleId",
                table: "ZzzOrganizationUnitRoles",
                columns: new[] { "TenantId", "RoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzOrganizationUnits_ParentId",
                table: "ZzzOrganizationUnits",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzOrganizationUnits_TenantId_Code",
                table: "ZzzOrganizationUnits",
                columns: new[] { "TenantId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzPermissions_RoleId",
                table: "ZzzPermissions",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzPermissions_TenantId_Name",
                table: "ZzzPermissions",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzPermissions_UserId",
                table: "ZzzPermissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoleClaims_RoleId",
                table: "ZzzRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoleClaims_TenantId_ClaimType",
                table: "ZzzRoleClaims",
                columns: new[] { "TenantId", "ClaimType" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoles_CreatorUserId",
                table: "ZzzRoles",
                column: "CreatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoles_DeleterUserId",
                table: "ZzzRoles",
                column: "DeleterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoles_LastModifierUserId",
                table: "ZzzRoles",
                column: "LastModifierUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzRoles_TenantId_NormalizedName",
                table: "ZzzRoles",
                columns: new[] { "TenantId", "NormalizedName" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzSettings_TenantId_Name_UserId",
                table: "ZzzSettings",
                columns: new[] { "TenantId", "Name", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZzzSettings_UserId",
                table: "ZzzSettings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenantNotifications_TenantId",
                table: "ZzzTenantNotifications",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenants_CreatorUserId",
                table: "ZzzTenants",
                column: "CreatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenants_DeleterUserId",
                table: "ZzzTenants",
                column: "DeleterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenants_EditionId",
                table: "ZzzTenants",
                column: "EditionId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenants_LastModifierUserId",
                table: "ZzzTenants",
                column: "LastModifierUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzTenants_TenancyName",
                table: "ZzzTenants",
                column: "TenancyName");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserAccounts_EmailAddress",
                table: "ZzzUserAccounts",
                column: "EmailAddress");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserAccounts_TenantId_EmailAddress",
                table: "ZzzUserAccounts",
                columns: new[] { "TenantId", "EmailAddress" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserAccounts_TenantId_UserId",
                table: "ZzzUserAccounts",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserAccounts_TenantId_UserName",
                table: "ZzzUserAccounts",
                columns: new[] { "TenantId", "UserName" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserAccounts_UserName",
                table: "ZzzUserAccounts",
                column: "UserName");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserClaims_TenantId_ClaimType",
                table: "ZzzUserClaims",
                columns: new[] { "TenantId", "ClaimType" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserClaims_UserId",
                table: "ZzzUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLoginAttempts_TenancyName_UserNameOrEmailAddress_Result",
                table: "ZzzUserLoginAttempts",
                columns: new[] { "TenancyName", "UserNameOrEmailAddress", "Result" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLoginAttempts_UserId_TenantId",
                table: "ZzzUserLoginAttempts",
                columns: new[] { "UserId", "TenantId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLogins_ProviderKey_TenantId",
                table: "ZzzUserLogins",
                columns: new[] { "ProviderKey", "TenantId" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLogins_TenantId_LoginProvider_ProviderKey",
                table: "ZzzUserLogins",
                columns: new[] { "TenantId", "LoginProvider", "ProviderKey" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLogins_TenantId_UserId",
                table: "ZzzUserLogins",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserLogins_UserId",
                table: "ZzzUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserNotifications_UserId_State_CreationTime",
                table: "ZzzUserNotifications",
                columns: new[] { "UserId", "State", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserOrganizationUnits_TenantId_OrganizationUnitId",
                table: "ZzzUserOrganizationUnits",
                columns: new[] { "TenantId", "OrganizationUnitId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserOrganizationUnits_TenantId_UserId",
                table: "ZzzUserOrganizationUnits",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserRoles_TenantId_RoleId",
                table: "ZzzUserRoles",
                columns: new[] { "TenantId", "RoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserRoles_TenantId_UserId",
                table: "ZzzUserRoles",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserRoles_UserId",
                table: "ZzzUserRoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUsers_CreatorUserId",
                table: "ZzzUsers",
                column: "CreatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUsers_DeleterUserId",
                table: "ZzzUsers",
                column: "DeleterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUsers_LastModifierUserId",
                table: "ZzzUsers",
                column: "LastModifierUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUsers_TenantId_NormalizedEmailAddress",
                table: "ZzzUsers",
                columns: new[] { "TenantId", "NormalizedEmailAddress" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUsers_TenantId_NormalizedUserName",
                table: "ZzzUsers",
                columns: new[] { "TenantId", "NormalizedUserName" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserTokens_TenantId_UserId",
                table: "ZzzUserTokens",
                columns: new[] { "TenantId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ZzzUserTokens_UserId",
                table: "ZzzUserTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ZzzWebhookSendAttempts_WebhookEventId",
                table: "ZzzWebhookSendAttempts",
                column: "WebhookEventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentSequence");

            migrationBuilder.DropTable(
                name: "FolioAdjustment");

            migrationBuilder.DropTable(
                name: "FolioPayment");

            migrationBuilder.DropTable(
                name: "FolioTransaction");

            migrationBuilder.DropTable(
                name: "GuestIdentification");

            migrationBuilder.DropTable(
                name: "HousekeepingLog");

            migrationBuilder.DropTable(
                name: "Incident");

            migrationBuilder.DropTable(
                name: "MenuItemOptionGroup");

            migrationBuilder.DropTable(
                name: "MenuItemOptionPriceOverride");

            migrationBuilder.DropTable(
                name: "MenuItemPriceAdjustment");

            migrationBuilder.DropTable(
                name: "MenuItemPromoItem");

            migrationBuilder.DropTable(
                name: "MenuModifier");

            migrationBuilder.DropTable(
                name: "PosOrderItemOption");

            migrationBuilder.DropTable(
                name: "PosOrderPayment");

            migrationBuilder.DropTable(
                name: "PosSession");

            migrationBuilder.DropTable(
                name: "PreCheckInExtraBed");

            migrationBuilder.DropTable(
                name: "PreCheckInRoom");

            migrationBuilder.DropTable(
                name: "QuotationExtraBed");

            migrationBuilder.DropTable(
                name: "QuotationRoom");

            migrationBuilder.DropTable(
                name: "RatePlanDateOverride");

            migrationBuilder.DropTable(
                name: "ReceiptPayment");

            migrationBuilder.DropTable(
                name: "ReservationDailyRate");

            migrationBuilder.DropTable(
                name: "ReservationDeposit");

            migrationBuilder.DropTable(
                name: "ReservationExtraBed");

            migrationBuilder.DropTable(
                name: "ReservationGuest");

            migrationBuilder.DropTable(
                name: "RoomChangeRequest");

            migrationBuilder.DropTable(
                name: "RoomRatePlanDay");

            migrationBuilder.DropTable(
                name: "RoomStatusLog");

            migrationBuilder.DropTable(
                name: "RoomTransfer");

            migrationBuilder.DropTable(
                name: "StayExtension");

            migrationBuilder.DropTable(
                name: "StayGuest");

            migrationBuilder.DropTable(
                name: "StayRoomTransfer");

            migrationBuilder.DropTable(
                name: "ZzzAuditLogs");

            migrationBuilder.DropTable(
                name: "ZzzBackgroundJobs");

            migrationBuilder.DropTable(
                name: "ZzzBinaryObjects");

            migrationBuilder.DropTable(
                name: "ZzzDynamicEntityPropertyValues");

            migrationBuilder.DropTable(
                name: "ZzzDynamicPropertyValues");

            migrationBuilder.DropTable(
                name: "ZzzEntityPropertyChanges");

            migrationBuilder.DropTable(
                name: "ZzzFeatures");

            migrationBuilder.DropTable(
                name: "ZzzGlobalNotifications");

            migrationBuilder.DropTable(
                name: "ZzzLanguages");

            migrationBuilder.DropTable(
                name: "ZzzLanguageTexts");

            migrationBuilder.DropTable(
                name: "ZzzNotifications");

            migrationBuilder.DropTable(
                name: "ZzzNotificationSubscriptions");

            migrationBuilder.DropTable(
                name: "ZzzOrganizationUnitRoles");

            migrationBuilder.DropTable(
                name: "ZzzOrganizationUnits");

            migrationBuilder.DropTable(
                name: "ZzzPermissions");

            migrationBuilder.DropTable(
                name: "ZzzRoleClaims");

            migrationBuilder.DropTable(
                name: "ZzzSettings");

            migrationBuilder.DropTable(
                name: "ZzzTenantNotifications");

            migrationBuilder.DropTable(
                name: "ZzzTenants");

            migrationBuilder.DropTable(
                name: "ZzzUserAccounts");

            migrationBuilder.DropTable(
                name: "ZzzUserClaims");

            migrationBuilder.DropTable(
                name: "ZzzUserLoginAttempts");

            migrationBuilder.DropTable(
                name: "ZzzUserLogins");

            migrationBuilder.DropTable(
                name: "ZzzUserNotifications");

            migrationBuilder.DropTable(
                name: "ZzzUserOrganizationUnits");

            migrationBuilder.DropTable(
                name: "ZzzUserRoles");

            migrationBuilder.DropTable(
                name: "ZzzUserTokens");

            migrationBuilder.DropTable(
                name: "ZzzWebhookSendAttempts");

            migrationBuilder.DropTable(
                name: "ZzzWebhookSubscriptions");

            migrationBuilder.DropTable(
                name: "Folio");

            migrationBuilder.DropTable(
                name: "CheckOutRecord");

            migrationBuilder.DropTable(
                name: "HousekeepingTask");

            migrationBuilder.DropTable(
                name: "MenuItemPromo");

            migrationBuilder.DropTable(
                name: "PosOption");

            migrationBuilder.DropTable(
                name: "PosOrderItem");

            migrationBuilder.DropTable(
                name: "PreCheckIn");

            migrationBuilder.DropTable(
                name: "Quotation");

            migrationBuilder.DropTable(
                name: "Receipt");

            migrationBuilder.DropTable(
                name: "ReservationRoom");

            migrationBuilder.DropTable(
                name: "PaymentMethod");

            migrationBuilder.DropTable(
                name: "ExtraBedType");

            migrationBuilder.DropTable(
                name: "RoomRatePlan");

            migrationBuilder.DropTable(
                name: "StayRoom");

            migrationBuilder.DropTable(
                name: "ZzzDynamicEntityProperties");

            migrationBuilder.DropTable(
                name: "ZzzEntityChanges");

            migrationBuilder.DropTable(
                name: "ZzzRoles");

            migrationBuilder.DropTable(
                name: "ZzzEditions");

            migrationBuilder.DropTable(
                name: "ZzzWebhookEvents");

            migrationBuilder.DropTable(
                name: "GuestRequest");

            migrationBuilder.DropTable(
                name: "OptionGroup");

            migrationBuilder.DropTable(
                name: "MenuItem");

            migrationBuilder.DropTable(
                name: "PosOrder");

            migrationBuilder.DropTable(
                name: "ZzzDynamicProperties");

            migrationBuilder.DropTable(
                name: "ZzzEntityChangeSets");

            migrationBuilder.DropTable(
                name: "ZzzUsers");

            migrationBuilder.DropTable(
                name: "MenuCategory");

            migrationBuilder.DropTable(
                name: "PosOutletTerminal");

            migrationBuilder.DropTable(
                name: "PosTable");

            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropTable(
                name: "Stay");

            migrationBuilder.DropTable(
                name: "PosOutlet");

            migrationBuilder.DropTable(
                name: "Reservation");

            migrationBuilder.DropTable(
                name: "Room");

            migrationBuilder.DropTable(
                name: "ChargeType");

            migrationBuilder.DropTable(
                name: "Guest");

            migrationBuilder.DropTable(
                name: "RoomType");
        }
    }
}
