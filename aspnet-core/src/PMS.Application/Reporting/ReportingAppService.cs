using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Timing;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.Authorization;
using PMS.Reporting.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Reporting;

[AbpAuthorize(PermissionNames.Pages_Reports)]
public class ReportingAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<Reservation, Guid> reservationRepository,
    IRepository<ReservationDeposit, Guid> reservationDepositRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<DayUsePayment, Guid> dayUsePaymentRepository,
    IRepository<PosOrder, Guid> posOrderRepository
) : ApplicationService, IReportingAppService
{
    public async Task<AccountsReceivableReportDto> GetAccountsReceivableReportAsync(DateTime? asOfDate = null)
    {
        var reportDate = (asOfDate ?? Clock.Now).Date;
        var nextDay = reportDate.AddDays(1);

        var reservations = await reservationRepository.GetAll()
            .Include(r => r.Rooms)
            .Include(r => r.ExtraBeds)
            .Where(r => r.Status == ReservationStatus.Confirmed)
            .Where(r => r.ReservationDate < nextDay)
            .ToListAsync();

        var reservationRows = reservations
            .Select(r =>
            {
                var roomAmount = r.Rooms.Sum(room => room.NetAmount > 0 ? room.NetAmount : room.Amount);
                var extrasAmount = r.ExtraBeds.Sum(extra => extra.NetAmount > 0 ? extra.NetAmount : extra.Amount);
                var totalAmount = roomAmount + extrasAmount;
                if (totalAmount <= 0)
                {
                    totalAmount = r.TotalAmount;
                }

                var depositPaid = Math.Max(0m, r.DepositPaid);
                var roomDepositApplied = 0m;
                var extrasDepositApplied = 0m;

                if (depositPaid > 0 && totalAmount > 0)
                {
                    roomDepositApplied = Math.Min(
                        roomAmount,
                        Math.Round(depositPaid * (roomAmount / totalAmount), 2, MidpointRounding.AwayFromZero));
                    extrasDepositApplied = Math.Min(extrasAmount, depositPaid - roomDepositApplied);

                    var unappliedDeposit = depositPaid - roomDepositApplied - extrasDepositApplied;
                    if (unappliedDeposit > 0)
                    {
                        if (roomAmount - roomDepositApplied >= extrasAmount - extrasDepositApplied)
                        {
                            roomDepositApplied = Math.Min(roomAmount, roomDepositApplied + unappliedDeposit);
                        }
                        else
                        {
                            extrasDepositApplied = Math.Min(extrasAmount, extrasDepositApplied + unappliedDeposit);
                        }
                    }
                }

                var roomBalance = Math.Max(0m, roomAmount - roomDepositApplied);
                var extrasBalance = Math.Max(0m, extrasAmount - extrasDepositApplied);
                var balance = Math.Max(0m, totalAmount - depositPaid);

                return new AccountsReceivableReservationRowDto
                {
                    ReservationNo = r.ReservationNo,
                    ArrivalDate = r.ArrivalDate,
                    GuestName = r.GuestName,
                    RoomAmount = roomAmount,
                    ExtrasAmount = extrasAmount,
                    TotalAmount = totalAmount,
                    DepositPaid = depositPaid,
                    RoomBalance = roomBalance,
                    ExtrasBalance = extrasBalance,
                    Balance = balance,
                };
            })
            .Where(r => r.Balance > 0)
            .OrderBy(r => r.ArrivalDate)
            .ThenBy(r => r.ReservationNo)
            .ToList();

        var inHouseFolios = await folioRepository.GetAll()
            .Include(f => f.Stay)
                .ThenInclude(s => s.Rooms)
                    .ThenInclude(sr => sr.Room)
            .Where(f => f.Stay != null)
            .Where(f => f.Stay!.Status == StayStatus.CheckedIn || f.Stay.Status == StayStatus.InHouse)
            .ToListAsync();

        var inHouseFolioIds = inHouseFolios.Select(f => f.Id).ToList();
        var inHouseCharges = await folioTransactionRepository.GetAll()
            .Include(t => t.ChargeType)
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => inHouseFolioIds.Contains(t.FolioId))
            .Where(t => t.TransactionDate < nextDay)
            .ToListAsync();

        var chargesByFolioId = inHouseCharges
            .GroupBy(t => t.FolioId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.NetAmount));

        var stayRows = inHouseFolios
            .Select(folio =>
            {
                var roomNumbers = folio.Stay != null
                    ? string.Join(", ", folio.Stay.Rooms.Where(sr => sr.Room != null && sr.ReleasedAt == null).Select(sr => sr.Room!.RoomNumber))
                    : string.Empty;

                return new AccountsReceivableStayRowDto
                {
                    StayNo = folio.Stay?.StayNo ?? string.Empty,
                    CheckInDateTime = folio.Stay?.CheckInDateTime ?? reportDate,
                    GuestName = folio.Stay?.GuestName ?? string.Empty,
                    RoomNumber = roomNumbers,
                    Charges = chargesByFolioId.TryGetValue(folio.Id, out var charges) ? charges : 0m,
                    Balance = folio.Balance,
                };
            })
            .Where(r => r.Balance > 0 || r.Charges > 0)
            .OrderBy(r => r.GuestName)
            .ThenBy(r => r.StayNo)
            .ToList();

        var byChargeType = new List<AccountsReceivableByChargeTypeDto>();
        var reservationBalanceTotal = reservationRows.Sum(r => r.Balance);
        var reservationRoomBalanceTotal = reservationRows.Sum(r => r.RoomBalance);
        var reservationExtrasBalanceTotal = reservationRows.Sum(r => r.ExtrasBalance);
        if (reservationRoomBalanceTotal > 0)
        {
            byChargeType.Add(new AccountsReceivableByChargeTypeDto
            {
                ChargeTypeName = "Reservation Room Outstanding",
                Amount = reservationRoomBalanceTotal,
            });
        }
        if (reservationExtrasBalanceTotal > 0)
        {
            byChargeType.Add(new AccountsReceivableByChargeTypeDto
            {
                ChargeTypeName = "Reservation Extras Outstanding",
                Amount = reservationExtrasBalanceTotal,
            });
        }

        byChargeType.AddRange(inHouseCharges
            .GroupBy(t => t.ChargeType?.Name ?? "Unassigned")
            .Select(g => new AccountsReceivableByChargeTypeDto
            {
                ChargeTypeName = g.Key,
                Amount = g.Sum(t => t.NetAmount),
            })
            .OrderByDescending(x => x.Amount)
            .ThenBy(x => x.ChargeTypeName));

        var inHouseBalanceTotal = stayRows.Sum(r => r.Balance);
        var inHouseChargesTotal = stayRows.Sum(r => r.Charges);

        return new AccountsReceivableReportDto
        {
            AsOfDate = reportDate,
            TotalReceivables = reservationBalanceTotal + inHouseBalanceTotal,
            ReservationBalanceTotal = reservationBalanceTotal,
            ReservationRoomBalanceTotal = reservationRoomBalanceTotal,
            ReservationExtrasBalanceTotal = reservationExtrasBalanceTotal,
            InHouseBalanceTotal = inHouseBalanceTotal,
            InHouseChargesTotal = inHouseChargesTotal,
            ByChargeType = byChargeType,
            Reservations = reservationRows,
            InHouseStays = stayRows,
        };
    }

    public async Task<DashboardKpisDto> GetDashboardKpisAsync(DateTime? asOfDate = null)
    {
        var date = (asOfDate ?? Clock.Now).Date;
        var startOfDay = date;
        var endOfDay = date.AddDays(1);

        var totalRooms = await roomRepository.GetAll().Where(r => r.IsActive).CountAsync();

        var inHouseStayRooms = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.Stay.Status == StayStatus.InHouse || sr.Stay.Status == StayStatus.CheckedIn)
            .Where(sr => sr.ReleasedAt == null)
            .ToListAsync();
        var inHouseRooms = inHouseStayRooms.Count;
        var inHouseStays = inHouseStayRooms.Select(sr => sr.StayId).Distinct().Count();

        var arrivalsToday = await stayRepository.GetAll()
            .Where(s => s.CheckInDateTime >= startOfDay && s.CheckInDateTime < endOfDay)
            .CountAsync();

        var departuresToday = await stayRepository.GetAll()
            .Where(s => s.ActualCheckOutDateTime.HasValue &&
                       s.ActualCheckOutDateTime.Value >= startOfDay &&
                       s.ActualCheckOutDateTime.Value < endOfDay)
            .CountAsync();

        var reservationsToday = await reservationRepository.GetAll()
            .Where(r => r.ArrivalDate >= startOfDay && r.ArrivalDate < endOfDay)
            .Where(r => r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending)
            .CountAsync();

        var noShowsToday = await reservationRepository.GetAll()
            .Where(r => r.Status == ReservationStatus.NoShow)
            .Where(r => r.LastModificationTime >= startOfDay && r.LastModificationTime < endOfDay)
            .CountAsync();

        var cancellationsToday = await reservationRepository.GetAll()
            .Where(r => r.Status == ReservationStatus.Cancelled)
            .Where(r => r.LastModificationTime >= startOfDay && r.LastModificationTime < endOfDay)
            .CountAsync();

        var roomRevenueToday = await folioTransactionRepository.GetAll()
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => t.TransactionDate >= startOfDay && t.TransactionDate < endOfDay)
            .SumAsync(t => t.NetAmount);

        var totalRevenueToday = await folioTransactionRepository.GetAll()
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => t.TransactionDate >= startOfDay && t.TransactionDate < endOfDay)
            .SumAsync(t => t.NetAmount);

        var paymentsToday = await folioPaymentRepository.GetAll()
            .Where(p => !p.IsVoided)
            .Where(p => p.PaidDate >= startOfDay && p.PaidDate < endOfDay)
            .SumAsync(p => p.Amount);

        var roomNightsToday = inHouseRooms; // for single day, rooms occupied = room-nights
        var roomNightsAvailableToday = totalRooms;
        var occupancyPercent = roomNightsAvailableToday > 0
            ? (decimal)roomNightsToday / roomNightsAvailableToday * 100
            : 0;

        // Rolling 30-day window including today.
        var rolling30From = date.AddDays(-29);
        var rolling30To = endOfDay;

        var roomNightsLast30 = await GetRoomNightsSoldAsync(rolling30From, rolling30To);
        var totalAvailable30 = totalRooms * 30;
        var roomRevenueLast30 = await GetRoomRevenueInRangeAsync(rolling30From, rolling30To);

        var adr = roomNightsLast30 > 0
            ? roomRevenueLast30 / roomNightsLast30
            : 0;
        var revPar = totalAvailable30 > 0
            ? roomRevenueLast30 / totalAvailable30
            : 0;

        return new DashboardKpisDto
        {
            AsOfDate = date,
            TotalRooms = totalRooms,
            InHouseRooms = inHouseRooms,
            InHouseStays = inHouseStays,
            ArrivalsToday = arrivalsToday,
            DeparturesToday = departuresToday,
            ReservationsToday = reservationsToday,
            NoShowsToday = noShowsToday,
            CancellationsToday = cancellationsToday,
            OccupancyPercent = Math.Round(occupancyPercent, 2),
            Adr = Math.Round(adr, 2),
            RevPar = Math.Round(revPar, 2),
            RoomRevenueToday = roomRevenueToday,
            TotalRevenueToday = totalRevenueToday,
            PaymentsToday = paymentsToday,
        };
    }

    public async Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate)
    {
        var from = fromDate.Date;
        var to = toDate.Date.AddHours(23).AddMinutes(59).AddSeconds(59);
        if (from >= to) to = from.AddDays(1);

        var totalRooms = await roomRepository.GetAll().Where(r => r.IsActive).CountAsync();
        var days = (int)(to - from).TotalDays;
        var totalRoomNightsAvailable = totalRooms * days;

        var stayRooms = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.ArrivalDate < to && sr.DepartureDate > from)
            .Where(sr => sr.Stay.Status == StayStatus.InHouse || sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.CheckedOut)
            .ToListAsync();

        var roomNightsSold = 0;
        var byDay = new List<OccupancyByDayDto>();
        for (var d = from; d < to; d = d.AddDays(1))
        {
            var dayStart = d;
            var dayEnd = d.AddDays(1);
            var occupied = stayRooms.Count(sr => sr.ArrivalDate < dayEnd && sr.DepartureDate > dayStart);
            roomNightsSold += occupied;
            byDay.Add(new OccupancyByDayDto
            {
                Date = d,
                RoomsOccupied = occupied,
                RoomsAvailable = totalRooms,
                OccupancyPercent = totalRooms > 0 ? Math.Round((decimal)occupied / totalRooms * 100, 2) : 0,
            });
        }

        var occupancyPercent = totalRoomNightsAvailable > 0
            ? Math.Round((decimal)roomNightsSold / totalRoomNightsAvailable * 100, 2)
            : 0;

        return new OccupancyReportDto
        {
            FromDate = from,
            ToDate = to,
            TotalRooms = totalRooms,
            TotalRoomNightsAvailable = totalRoomNightsAvailable,
            RoomNightsSold = roomNightsSold,
            OccupancyPercent = occupancyPercent,
            ByDay = byDay,
        };
    }

    public async Task<RevenueReportDto> GetRevenueReportAsync(DateTime fromDate, DateTime toDate)
    {
        var from = fromDate.Date;
        var to = toDate.Date.AddDays(1);

        var charges = await folioTransactionRepository.GetAll()
            .Include(t => t.ChargeType)
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => t.TransactionDate >= from && t.TransactionDate < to)
            .ToListAsync();
        var payments = await folioPaymentRepository.GetAll()
            .Where(p => !p.IsVoided)
            .Where(p => p.PaidDate >= from && p.PaidDate < to)
            .ToListAsync();
        var discounts = await folioTransactionRepository.GetAll()
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Discount)
            .Where(t => t.TransactionDate >= from && t.TransactionDate < to)
            .SumAsync(t => t.Amount);

        var totalCharges = charges.Sum(t => t.NetAmount);
        var totalPayments = payments.Sum(p => p.Amount);

        var byDay = charges
            .GroupBy(t => t.TransactionDate.Date)
            .Select(g => new RevenueByDayDto
            {
                Date = g.Key,
                Charges = g.Sum(t => t.NetAmount),
                Payments = payments.Where(p => p.PaidDate.Date == g.Key).Sum(p => p.Amount),
            })
            .Concat(payments
                .GroupBy(p => p.PaidDate.Date)
                .Where(g => !charges.Any(c => c.TransactionDate.Date == g.Key))
                .Select(g => new RevenueByDayDto { Date = g.Key, Charges = 0, Payments = g.Sum(p => p.Amount) }))
            .GroupBy(x => x.Date)
            .Select(g => new RevenueByDayDto
            {
                Date = g.Key,
                Charges = g.Sum(x => x.Charges),
                Payments = g.Sum(x => x.Payments),
            })
            .OrderBy(x => x.Date)
            .ToList();

        var byChargeType = charges
            .Where(t => t.ChargeTypeId.HasValue)
            .GroupBy(t => t.ChargeTypeId!.Value)
            .Select(g => new RevenueByChargeTypeDto
            {
                ChargeTypeName = g.First().ChargeType?.Name ?? "Unknown",
                Amount = g.Sum(t => t.NetAmount),
            })
            .OrderByDescending(x => x.Amount)
            .ToList();

        return new RevenueReportDto
        {
            FromDate = from,
            ToDate = to.AddDays(-1),
            TotalCharges = totalCharges,
            TotalPayments = totalPayments,
            TotalDiscounts = discounts,
            ByDay = byDay,
            ByChargeType = byChargeType,
        };
    }

    public async Task<SalesReportDto> GetSalesReportAsync(DateTime fromDate, DateTime toDate)
    {
        var from = fromDate.Date;
        var to = toDate.Date.AddDays(1);

        var reservationDeposits = await reservationDepositRepository.GetAll()
            .Include(p => p.PaymentMethod)
            .Include(p => p.Reservation)
            .Where(p => p.PaidDate >= from && p.PaidDate < to)
            .Where(p => p.Reservation.Status != ReservationStatus.Cancelled)
            .ToListAsync();

        var folioPayments = await folioPaymentRepository.GetAll()
            .Include(p => p.PaymentMethod)
            .Include(p => p.Folio)
                .ThenInclude(f => f.Stay)
            .Where(p => !p.IsVoided)
            .Where(p => p.PaidDate >= from && p.PaidDate < to)
            .ToListAsync();

        var dayUsePayments = await dayUsePaymentRepository.GetAll()
            .Include(p => p.PaymentMethod)
            .Include(p => p.DayUseVisit)
            .Where(p => p.PaidAt >= from && p.PaidAt < to)
            .Where(p => p.DayUseVisit.Status != DayUseStatus.Cancelled)
            .ToListAsync();

        var payments = reservationDeposits
            .Select(p => new SalesPaymentRowDto
            {
                ReceivedAt = p.PaidDate,
                PaymentMethodId = p.PaymentMethodId,
                PaymentMethodName = p.PaymentMethod?.Name ?? "Unknown",
                SourceType = "Reservation",
                DocumentNo = p.Reservation?.ReservationNo ?? string.Empty,
                Description = p.Reservation?.GuestName ?? string.Empty,
                ReferenceNo = p.ReferenceNo,
                Amount = p.Amount,
            })
            .Concat(folioPayments.Select(p => new SalesPaymentRowDto
            {
                ReceivedAt = p.PaidDate,
                PaymentMethodId = p.PaymentMethodId,
                PaymentMethodName = p.PaymentMethod?.Name ?? "Unknown",
                SourceType = "Check-In / Arrival",
                DocumentNo = p.Folio?.FolioNo ?? string.Empty,
                Description = p.Folio?.Stay != null
                    ? $"{p.Folio.Stay.StayNo} · {p.Folio.Stay.GuestName}"
                    : string.Empty,
                ReferenceNo = p.ReferenceNo,
                Amount = p.Amount,
            }))
            .Concat(dayUsePayments.Select(p => new SalesPaymentRowDto
            {
                ReceivedAt = p.PaidAt,
                PaymentMethodId = p.PaymentMethodId,
                PaymentMethodName = p.PaymentMethod?.Name ?? "Unknown",
                SourceType = "Day Use",
                DocumentNo = p.DayUseVisit?.VisitNo ?? string.Empty,
                Description = p.DayUseVisit?.GuestName ?? string.Empty,
                ReferenceNo = p.ReferenceNo,
                Amount = p.Amount,
            }))
            .OrderBy(p => p.PaymentMethodName)
            .ThenBy(p => p.ReceivedAt)
            .ThenBy(p => p.DocumentNo)
            .ToList();

        var byPaymentMethod = payments
            .GroupBy(p => new { p.PaymentMethodId, p.PaymentMethodName })
            .Select(g => new SalesByPaymentMethodDto
            {
                PaymentMethodId = g.Key.PaymentMethodId,
                PaymentMethodName = g.Key.PaymentMethodName,
                Amount = g.Sum(p => p.Amount),
                PaymentsCount = g.Count(),
            })
            .OrderByDescending(x => x.Amount)
            .ThenBy(x => x.PaymentMethodName)
            .ToList();

        return new SalesReportDto
        {
            FromDate = from,
            ToDate = to.AddDays(-1),
            TotalPayments = payments.Sum(p => p.Amount),
            PaymentsCount = payments.Count,
            ByPaymentMethod = byPaymentMethod,
            Payments = payments,
        };
    }

    public async Task<NightAuditSummaryDto> GetNightAuditSummaryAsync(DateTime auditDate)
    {
        var date = auditDate.Date;
        var startOfDay = date;
        var endOfDay = date.AddDays(1);

        var arrivals = await stayRepository.GetAll()
            .Where(s => s.CheckInDateTime >= startOfDay && s.CheckInDateTime < endOfDay)
            .CountAsync();
        var departures = await stayRepository.GetAll()
            .Where(s => s.ActualCheckOutDateTime.HasValue &&
                        s.ActualCheckOutDateTime.Value >= startOfDay &&
                        s.ActualCheckOutDateTime.Value < endOfDay)
            .CountAsync();

        var inHouseAtStart = await GetInHouseRoomCountAtAsync(date);
        var inHouseAtEnd = await GetInHouseRoomCountAtAsync(date.AddDays(1));

        var roomsSold = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.ArrivalDate < endOfDay && sr.DepartureDate > startOfDay)
            .Where(sr => sr.Stay.Status == StayStatus.InHouse || sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.CheckedOut)
            .CountAsync();

        var roomRevenue = await folioTransactionRepository.GetAll()
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => t.TransactionDate >= startOfDay && t.TransactionDate < endOfDay)
            .SumAsync(t => t.NetAmount);
        var totalCharges = roomRevenue;
        var totalPayments = await folioPaymentRepository.GetAll()
            .Where(p => !p.IsVoided)
            .Where(p => p.PaidDate >= startOfDay && p.PaidDate < endOfDay)
            .SumAsync(p => p.Amount);
        var outstandingBalance = await folioRepository.GetAll()
            .Where(f => f.Status == FolioStatus.Open || f.Status == FolioStatus.PartiallyPaid)
            .SumAsync(f => f.Balance);

        var folios = await folioRepository.GetAll()
            .Include(f => f.Stay).ThenInclude(s => s!.Rooms).ThenInclude(sr => sr.Room)
            .Where(f => f.Stay != null)
            .Where(f => f.Stay!.CheckInDateTime < endOfDay && (f.Stay.ActualCheckOutDateTime == null || f.Stay.ActualCheckOutDateTime >= startOfDay))
            .ToListAsync();
        var folioSummary = new List<NightAuditFolioRowDto>();
        foreach (var folio in folios)
        {
            var stay = folio.Stay!;
            var roomNumbers = string.Join(", ", stay.Rooms.Where(sr => sr.Room != null).Select(sr => sr.Room!.RoomNumber));
            var charges = await folioTransactionRepository.GetAll()
                .Where(t => t.FolioId == folio.Id && !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
                .SumAsync(t => t.NetAmount);
            var pays = await folioPaymentRepository.GetAll()
                .Where(p => p.FolioId == folio.Id && !p.IsVoided)
                .SumAsync(p => p.Amount);
            folioSummary.Add(new NightAuditFolioRowDto
            {
                StayNo = stay.StayNo,
                GuestName = stay.GuestName,
                RoomNumber = roomNumbers,
                Charges = charges,
                Payments = pays,
                Balance = folio.Balance,
            });
        }

        return new NightAuditSummaryDto
        {
            AuditDate = date,
            Arrivals = arrivals,
            Departures = departures,
            InHouseAtStart = inHouseAtStart,
            InHouseAtEnd = inHouseAtEnd,
            RoomsSold = roomsSold,
            RoomRevenue = roomRevenue,
            OtherRevenue = 0,
            TotalCharges = totalCharges,
            TotalPayments = totalPayments,
            OutstandingBalance = outstandingBalance,
            FolioSummary = folioSummary,
        };
    }

    [AbpAuthorize(PermissionNames.Pages_Reports, PermissionNames.Pages_POS)]
    public async Task<PosSalesSummaryDto> GetPosSalesSummaryAsync(DateTime fromDate, DateTime toDate, Guid? outletId = null)
    {
        var from = fromDate.Date;
        var to = toDate.Date.AddDays(1);

        var query = posOrderRepository.GetAll()
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .Include(o => o.Outlet)
            .Where(o => o.Status == PosOrderStatus.Closed && o.ClosedAt.HasValue)
            .Where(o => o.ClosedAt >= from && o.ClosedAt < to);
        if (outletId.HasValue)
            query = query.Where(o => o.OutletId == outletId.Value);

        var orders = await query.ToListAsync();
        var ordersCount = orders.Count;
        decimal salesTotal = 0;
        decimal paymentsTotal = 0;
        foreach (var order in orders)
        {
            var itemsTotal = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
            var discount = itemsTotal * order.DiscountPercent / 100m + order.DiscountAmount + order.SeniorCitizenDiscount;
            var total = itemsTotal - discount + order.ServiceChargeAmount + order.RoomServiceChargeAmount;
            salesTotal += total;
            paymentsTotal += order.Payments.Sum(p => p.Amount);
        }

        var byOutlet = orders
            .GroupBy(o => new { o.OutletId, o.Outlet?.Name })
            .Select(g =>
            {
                decimal outletSales = 0;
                foreach (var o in g)
                {
                    var itemsTotal = o.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
                    var discount = itemsTotal * o.DiscountPercent / 100m + o.DiscountAmount + o.SeniorCitizenDiscount;
                    outletSales += itemsTotal - discount + o.ServiceChargeAmount + o.RoomServiceChargeAmount;
                }
                return new PosSalesByOutletDto
                {
                    OutletId = g.Key.OutletId,
                    OutletName = g.Key.Name ?? string.Empty,
                    OrdersCount = g.Count(),
                    SalesTotal = outletSales,
                };
            })
            .ToList();

        var byDay = orders
            .GroupBy(o => o.ClosedAt!.Value.Date)
            .Select(g =>
            {
                decimal daySales = 0;
                foreach (var o in g)
                {
                    var itemsTotal = o.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
                    var discount = itemsTotal * o.DiscountPercent / 100m + o.DiscountAmount + o.SeniorCitizenDiscount;
                    daySales += itemsTotal - discount + o.ServiceChargeAmount + o.RoomServiceChargeAmount;
                }
                return new PosSalesByDayDto
                {
                    Date = g.Key,
                    OrdersCount = g.Count(),
                    SalesTotal = daySales,
                };
            })
            .OrderBy(x => x.Date)
            .ToList();

        return new PosSalesSummaryDto
        {
            FromDate = from,
            ToDate = to.AddDays(-1),
            OrdersCount = ordersCount,
            SalesTotal = salesTotal,
            PaymentsTotal = paymentsTotal,
            ByOutlet = byOutlet,
            ByDay = byDay,
        };
    }

    [AbpAuthorize(PermissionNames.Pages_Reports, PermissionNames.Pages_POS)]
    public async Task<PosZReportDto> GetPosZReportAsync(DateTime reportDate, Guid? outletId = null)
    {
        var date = reportDate.Date;
        var startOfDay = date;
        var endOfDay = date.AddDays(1);

        var query = posOrderRepository.GetAll()
            .Include(o => o.Items)
            .Include(o => o.Payments).ThenInclude(p => p.PaymentMethod)
            .Include(o => o.Outlet)
            .Where(o => o.Status == PosOrderStatus.Closed && o.ClosedAt.HasValue)
            .Where(o => o.ClosedAt >= startOfDay && o.ClosedAt < endOfDay);
        if (outletId.HasValue)
            query = query.Where(o => o.OutletId == outletId.Value);

        var orders = await query.ToListAsync();
        decimal grossSales = 0;
        decimal discountsTotal = 0;
        decimal serviceChargesTotal = 0;
        decimal netSales = 0;
        decimal paymentsTotal = 0;

        foreach (var order in orders)
        {
            var itemsTotal = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
            var orderDiscount = itemsTotal * order.DiscountPercent / 100m + order.DiscountAmount + order.SeniorCitizenDiscount;
            var orderService = order.ServiceChargeAmount + order.RoomServiceChargeAmount;
            var orderNet = itemsTotal - orderDiscount + orderService;

            grossSales += itemsTotal;
            discountsTotal += orderDiscount;
            serviceChargesTotal += orderService;
            netSales += orderNet;
            paymentsTotal += order.Payments.Sum(p => p.Amount);
        }

        var paymentsByMethod = orders
            .SelectMany(o => o.Payments)
            .GroupBy(p => new { p.PaymentMethodId, p.PaymentMethod!.Name })
            .Select(g => new PosZReportPaymentRowDto
            {
                PaymentMethodId = g.Key.PaymentMethodId,
                PaymentMethodName = g.Key.Name ?? string.Empty,
                Amount = g.Sum(p => p.Amount),
            })
            .OrderByDescending(x => x.Amount)
            .ToList();

        var outletName = string.Empty;
        if (outletId.HasValue && orders.Count > 0)
            outletName = orders.First().Outlet?.Name ?? string.Empty;
        else if (orders.Count > 0 && orders.All(o => o.OutletId == orders.First().OutletId))
            outletName = orders.First().Outlet?.Name ?? string.Empty;

        return new PosZReportDto
        {
            ReportDate = date,
            ReportType = "Z-Report",
            OutletId = outletId,
            OutletName = outletName,
            GeneratedAt = Clock.Now,
            OrdersCount = orders.Count,
            GrossSales = grossSales,
            DiscountsTotal = discountsTotal,
            ServiceChargesTotal = serviceChargesTotal,
            NetSales = netSales,
            PaymentsTotal = paymentsTotal,
            PaymentsByMethod = paymentsByMethod,
        };
    }

    private async Task<int> GetRoomNightsSoldAsync(DateTime from, DateTime to)
    {
        var stayRooms = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.ArrivalDate < to && sr.DepartureDate > from)
            .Where(sr => sr.Stay.Status == StayStatus.InHouse || sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.CheckedOut)
            .ToListAsync();
        var nights = 0;
        for (var d = from; d < to; d = d.AddDays(1))
        {
            var dayEnd = d.AddDays(1);
            nights += stayRooms.Count(sr => sr.ArrivalDate < dayEnd && sr.DepartureDate > d);
        }
        return nights;
    }

    private async Task<decimal> GetRoomRevenueInRangeAsync(DateTime from, DateTime to)
    {
        return await folioTransactionRepository.GetAll()
            .Where(t => !t.IsVoided && t.TransactionType == FolioTransactionType.Charge)
            .Where(t => t.TransactionDate >= from && t.TransactionDate < to)
            .SumAsync(t => t.NetAmount);
    }

    private async Task<int> GetInHouseRoomCountAtAsync(DateTime at)
    {
        return await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.Stay!.CheckInDateTime < at)
            .Where(sr => sr.Stay.ActualCheckOutDateTime == null || sr.Stay.ActualCheckOutDateTime >= at)
            .Where(sr => sr.Stay.Status == StayStatus.InHouse || sr.Stay.Status == StayStatus.CheckedIn)
            .Where(sr => sr.ArrivalDate < at && sr.DepartureDate > at)
            .CountAsync();
    }
}
