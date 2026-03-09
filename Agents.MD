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

The system must be **fast, consistent, and safe under concurrent reservations**.

---

# 2. Availability Model

Availability is based on **date-only occupancy**, not datetime.

## Date Rules

ArrivalDate = check-in date  
DepartureDate = check-out date

A room is occupied for nights between:
