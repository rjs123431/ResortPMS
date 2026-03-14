F&B POS Module PRD (Resort PMS)
1. Overview

The Food & Beverage POS module allows restaurants, bars, and room service within the resort to:

create orders

process payments

post charges to guest rooms (folio)

manage tables

track sales and revenue

The POS must support both:

Guest Dining
Walk-in Customers
Room Charge (Post to Stay Folio)
2. Core Objectives

The POS system should enable:

Restaurant order management

Table service operations

Room charge posting to folio

Payment processing

Kitchen order routing

Sales reporting

Inventory deduction (optional phase)

3. Major POS Features
Order Management

Create order

Add items

Modify items

Cancel items

Split orders

Transfer tables

Send order to kitchen

Print bill

Table Management

Table status tracking

Table assignment

Table transfer

Merge tables

Split tables

Table statuses:

Available
Occupied
Reserved
Cleaning
Menu Management

Menu categories

Menu items

Pricing

Modifiers

Availability

Example:

Beverages
    Coffee
    Beer

Main Course
    Steak
    Pasta
Room Charge Posting

Guests dining in restaurants can charge meals to their room folio.

Flow:

Select Room
Verify Guest
Post Charge to Folio

This integrates with:

Stay
Folio
FolioTransactions
Payment Processing

POS must support:

Cash
Card
Room Charge
E-Wallet
Split Payments
Kitchen Order System (KOT)

When order is confirmed:

Send to Kitchen Printer

Kitchen receives:

Kitchen Order Ticket (KOT)
4. Key Entities
Outlets

Restaurant locations.

Example:

Main Restaurant
Pool Bar
Beach Bar
Room Service

Fields:

Id
Name
Location
IsActive
Tables

Restaurant seating.

Fields:

Id
OutletId
TableNumber
Capacity
Status
MenuCategories
Id
Name
DisplayOrder

Example:

Appetizers
Main Course
Desserts
Beverages
MenuItems
Id
CategoryId
Name
Price
IsAvailable

Example:

Grilled Salmon
Price: 450
MenuModifiers (Optional)

Example:

Extra Cheese
Add Bacon
Less Sugar
5. Order Tables
Orders

Header of POS order.

Fields:

Id
OutletId
TableId
StayId (nullable)
GuestName
OrderNumber
OrderType
Status
OpenedAt
ClosedAt

OrderType:

DineIn
Takeaway
RoomCharge
OrderItems

Line items of the order.

Fields:

Id
OrderId
MenuItemId
Quantity
Price
Status
Notes

Status:

Pending
SentToKitchen
Served
Cancelled
OrderPayments

Fields:

Id
OrderId
PaymentMethodId
Amount
PaidAt
6. POS Process Flow
Dine-In Order

Flow:

Select Table
      ↓
Create Order
      ↓
Add Items
      ↓
Send to Kitchen
      ↓
Kitchen prepares food
      ↓
Serve guest
      ↓
Request bill
      ↓
Process payment
      ↓
Close order
Room Charge Flow

Guest dining in restaurant but wants to charge to room.

Create Order
      ↓
Add Items
      ↓
Select Room Charge
      ↓
Enter Room Number
      ↓
Verify Stay
      ↓
Post to FolioTransactions
      ↓
Close POS Order

Example folio entry:

TransactionType = Charge
ChargeType = Restaurant
Amount = -650
Description = Restaurant Bill #1021
7. Room Charge Validation

Before posting to folio verify:

Stay.Status = InHouse
Room matches stay
Folio.Status = Open

Optional:

Check credit limit
Require guest signature
8. Kitchen Order Ticket Flow

Order placed:

Waiter
   ↓
POS
   ↓
Kitchen Printer
   ↓
Chef
   ↓
Food ready

Ticket contains:

Table
Items
Modifiers
Special notes
9. Example POS Transaction

Table order:

Item	Qty	Price
Steak	1	550
Beer	2	180

Total:

910

Room charge posted:

Folio ledger:

Type	Description	Amount
Charge	Restaurant Bill #2031	-910
10. POS Order Status Lifecycle
Open
SentToKitchen
Preparing
Served
Billed
Closed
Cancelled
11. POS Reporting

Reports required:

Sales Reports
Daily Sales
Sales by Outlet
Sales by Item
Sales by Category
Sales by Staff
Operational Reports
Open Tables
Active Orders
Kitchen Queue
Cancelled Items
12. Integration With PMS

POS interacts with:

Module	Integration
Stays	verify room charge
Folios	post transactions
Rooms	validate occupancy
Accounting	revenue
13. Optional Future Features

Phase 2:

Inventory deduction
Recipe costing
Happy hour pricing
Service charge
Taxes
Mobile waiter app
QR ordering
14. Example Architecture
PMS
 ├ Reservations
 ├ Stays
 ├ Rooms
 ├ Billing / Folio
 └ POS
      ├ Orders
      ├ Menu
      ├ Tables
      ├ Kitchen
      └ Payments
15. Example API Endpoints

Create order:

POST /pos/orders

Add item:

POST /pos/orders/{id}/items

Send to kitchen:

POST /pos/orders/{id}/send

Close order:

POST /pos/orders/{id}/close

Room charge:

POST /pos/orders/{id}/charge-room
16. Recommended Order Types
DineIn
Takeaway
RoomCharge
PoolService
RoomService
Final POS Flow Summary
Open Order
    ↓
Add Items
    ↓
Send to Kitchen
    ↓
Serve
    ↓
Bill
    ↓
Payment OR Room Charge
    ↓
Close Order

If you'd like, I can also show you the ideal database schema for a resort POS integrated with PMS, which avoids many problems like:

duplicate charges

folio posting errors

split bill issues

kitchen routing problems.