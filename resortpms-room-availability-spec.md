
# ResortPMS Room Availability System
## AI-Ready Technical Specification

Version: 1.0  
Target Platform: .NET 9 + EF Core  
Architecture: Modular Monolith  
Modules: Rooms, Reservations, Stays, Inventory

---

# 1. Purpose

The Room Availability System determines whether rooms or room types are available for a requested stay period.

It must support:

- Reservation availability search
- Walk-in availability
- Room assignment validation
- Check-in validation
- Preventing overbooking
- High performance under concurrency

The system must be fast, consistent, and safe under concurrent reservations.

---

# 2. Availability Model

Availability is based on **date-only occupancy**, not datetime.

ArrivalDate = check-in date  
DepartureDate = check-out date

A room is occupied for nights between:

ArrivalDate <= Night < DepartureDate

Example:

Reservation: Mar 10 → Mar 12  
Nights Occupied: Mar 10, Mar 11  
Room becomes available again on Mar 12.

---

# 3. Overlap Rule

Two bookings overlap if:

existing.ArrivalDate < requested.DepartureDate  
AND existing.DepartureDate > requested.ArrivalDate

Example:

Existing booking: Mar 10 → Mar 12  
Requested booking: Mar 12 → Mar 14  

Result: No overlap → Allowed.

---

# 4. Availability Types

## 4.1 Room Type Availability

Used when creating reservations.

Question:

Can we sell this room type for the requested dates?

Formula:

AvailableRooms =  
TotalRooms  
- ReservedRooms  
- OccupiedRooms  
- OutOfOrderRooms

Must be validated for every date in the stay range.

---

## 4.2 Specific Room Availability

Used for:

- room assignment
- check-in validation
- room transfer

Room is available if:

- room is active
- room is not OutOfOrder or Maintenance
- no overlapping reservation blocks it
- no overlapping stay occupies it

---

# 5. Blocking Status Rules

## Reservation Status That Blocks

- PendingHold
- Confirmed
- Guaranteed
- CheckedIn

## Reservation Status That Does NOT Block

- Cancelled
- NoShow
- Completed

## Stay Status That Blocks

- CheckedIn
- InHouse

## Stay Status That Does NOT Block

- CheckedOut
- Closed

---

# 6. Database Entities

## Rooms

Fields:

Id  
PropertyId  
RoomTypeId  
RoomNumber  
Floor  
Status  
IsActive

RoomStatus values:

- VacantClean
- VacantDirty
- Occupied
- Reserved
- OutOfOrder
- Maintenance
- Locked

---

## RoomTypes

Fields:

Id  
PropertyId  
Name  
MaxAdults  
MaxChildren  
BaseRate  
IsActive

---

## ReservationRooms

Fields:

Id  
ReservationId  
RoomTypeId  
RoomId  
ArrivalDate  
DepartureDate  
Status  
IsInventoryBlocking

Indexes:

IX_ReservationRooms_RoomId_ArrivalDate_DepartureDate  
IX_ReservationRooms_RoomTypeId_ArrivalDate_DepartureDate

---

## StayRooms

Fields:

Id  
StayId  
RoomId  
RoomTypeId  
ArrivalDate  
DepartureDate  
Status  
IsOccupancyBlocking

Indexes:

IX_StayRooms_RoomId_ArrivalDate_DepartureDate  
IX_StayRooms_RoomTypeId_ArrivalDate_DepartureDate

---

# 7. Inventory Optimization Table

RoomTypeInventoryDaily

Fields:

Id  
PropertyId  
RoomTypeId  
BusinessDate  
TotalRooms  
ReservedRooms  
OccupiedRooms  
OutOfOrderRooms  
AvailableRooms  
RowVersion

Unique Index:

(PropertyId, RoomTypeId, BusinessDate)

---

# 8. Inventory Calculation

AvailableRooms =  
TotalRooms  
- ReservedRooms  
- OccupiedRooms  
- OutOfOrderRooms

---

# 9. Availability Queries

## Room Type Availability

SELECT MIN(AvailableRooms)  
FROM RoomTypeInventoryDaily  
WHERE PropertyId = @PropertyId  
AND RoomTypeId = @RoomTypeId  
AND BusinessDate >= @ArrivalDate  
AND BusinessDate < @DepartureDate

If result >= requested rooms → available.

---

## Specific Room Availability

Room.IsActive = true  
AND Room.Status NOT IN (OutOfOrder, Maintenance, Locked)  
AND no overlapping ReservationRooms  
AND no overlapping StayRooms

---

# 10. Domain Service

IRoomAvailabilityService

Methods:

CheckRoomTypeAvailabilityAsync  
IsRoomAvailableAsync  
SearchAvailableRoomTypesAsync  
SearchAvailableRoomsAsync

---

# 11. Reservation Commit Algorithm

BEGIN TRANSACTION

1 Validate dates  
2 Fetch RoomTypeInventoryDaily rows  
3 Ensure AvailableRooms >= requested quantity  
4 Create Reservation  
5 Create ReservationRooms  

Update inventory:

ReservedRooms += requested  
AvailableRooms -= requested  

COMMIT

---

# 12. Walk-In Algorithm

BEGIN TRANSACTION

1 search available rooms today  
2 select room  
3 create stay  
4 create stay room  

Update inventory:

OccupiedRooms += 1  
AvailableRooms -= 1

Update room status = Occupied

COMMIT

---

# 13. Check-In Algorithm

BEGIN TRANSACTION

1 validate reservation  
2 validate room availability  
3 create stay  
4 create stay room  

Inventory update:

ReservedRooms -= 1  
OccupiedRooms += 1

Set room status = Occupied

COMMIT

---

# 14. Check-Out Algorithm

BEGIN TRANSACTION

1 close stay  
2 update stay room departure  

Inventory update:

OccupiedRooms -= 1  
AvailableRooms += 1

Set room status = VacantDirty

COMMIT

---

# 15. Inventory Update Triggers

Inventory must update when:

- ReservationCreated
- ReservationCancelled
- ReservationModified
- RoomAssigned
- CheckIn
- CheckOut
- RoomTransfer
- RoomOutOfOrder
- RoomBackInService

Inventory updates should use delta updates, not full recomputation.

---

# 16. Concurrency Protection

Use optimistic concurrency.

RoomTypeInventoryDaily must include:

RowVersion

EF Core:

builder.Property(x => x.RowVersion)
       .IsRowVersion();

On conflict:

Retry transaction once  
Otherwise return availability error

---

# 17. Critical Database Indexes

Rooms:

IX_Rooms_PropertyId_RoomTypeId_IsActive_Status

ReservationRooms:

IX_ReservationRooms_RoomId_ArrivalDate_DepartureDate  
IX_ReservationRooms_RoomTypeId_ArrivalDate_DepartureDate

StayRooms:

IX_StayRooms_RoomId_ArrivalDate_DepartureDate  
IX_StayRooms_RoomTypeId_ArrivalDate_DepartureDate

Inventory:

UX_RoomTypeInventoryDaily_PropertyId_RoomTypeId_BusinessDate

---

# 18. Availability Policy

ReservationBlockingStatuses:

PendingHold  
Confirmed  
Guaranteed  
CheckedIn

StayBlockingStatuses:

CheckedIn  
InHouse

Overlap rule:

existingStart < requestedEnd  
AND existingEnd > requestedStart

---

# 19. Performance Targets

Reservation search: < 20 ms  
Room validation: < 10 ms  
Inventory transaction: < 50 ms

---

# 20. Recommended Module Structure

Modules:

Rooms  
Reservations  
Stays  
Inventory  
Availability

Availability module contains:

IRoomAvailabilityService  
RoomAvailabilityService  
AvailabilityPolicy  
DTOs  
Queries

---

# 21. Safety Rules

Never rely on search results alone.

Before these operations, revalidate availability inside a transaction:

CreateReservation  
AssignRoom  
CheckIn  
RoomTransfer

---

# End of Specification
