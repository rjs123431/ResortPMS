# Resort Property Management System (ResortPMS)
## Product Requirements Document (PRD)

Version: 1.0  
Scope: Reservation → Check-In → Stay → Check-Out  
Target: Resort / Hotel Front Desk Operations

---

# 1. Overview

The Resort Property Management System (ResortPMS) manages guest stays in a resort or hotel environment.

The initial release focuses on the core operational workflow:

Reservation → Check-In → Stay → Check-Out

This system manages:

- Guest profiles
- Room inventory
- Reservations
- Check-in operations
- Guest stay management
- Billing and folios
- Payments and settlement
- Check-out processing

The system will be implemented as a modular backend API suitable for enterprise environments.

---

# 2. Objectives

Primary objectives:

1. Manage room reservations
2. Handle guest check-ins and walk-ins
3. Track in-house guests
4. Record all guest charges during stay
5. Manage billing through guest folios
6. Process payments and settlements
7. Complete guest check-out and release rooms

---

# 3. Core Workflow

## 3.1 Reservation

Guest books a room for a future stay.

Steps:

1. Guest profile created or selected
2. Room availability checked
3. Room type or specific room selected
4. Arrival and departure dates defined
5. Rate applied
6. Reservation stored with confirmation number
7. Optional deposit recorded

Reservation Status:

- Draft
- Pending
- Confirmed
- Cancelled
- NoShow
- CheckedIn
- Completed

---

## 3.2 Check-In

Guest arrives at the property.

Check-in may come from:

- Existing reservation
- Walk-in guest

Steps:

1. Retrieve reservation or create walk-in
2. Verify guest details
3. Assign actual room
4. Register occupants
5. Capture identification
6. Record deposit or advance payment
7. Create Stay record
8. Change room status to Occupied

Stay status becomes:

CheckedIn → InHouse

---

## 3.3 Stay (In-House Guest)

During the guest stay the system manages:

- Occupancy
- Room status
- Charges
- Payments
- Guest requests

Possible actions:

- Post charges
- Add amenities
- Record services
- Extend stay
- Transfer rooms
- Record incidents
- Accept partial payments

---

## 3.4 Check-Out

Guest leaves the property.

Steps:

1. Generate statement of account
2. Review charges
3. Apply deposits
4. Record payment
5. Close folio
6. Create receipt
7. Update room status
8. Mark stay as completed

---

# 4. Functional Modules

## 4.1 Guest Management

Features:

- Create guest profile
- Update guest information
- Store guest contact details
- Record guest identification
- Track guest stay history

---

## 4.2 Room Management

Features:

- Manage room types
- Manage individual rooms
- Track room status
- Assign rooms to reservations
- Assign rooms during check-in

Room statuses include:

- VacantClean
- VacantDirty
- Occupied
- Reserved
- OutOfOrder
- Maintenance

---

## 4.3 Reservation Management

Features:

- Create reservation
- Modify reservation
- Cancel reservation
- Reservation status tracking
- Assign room types
- Manage arrival and departure dates
- Store reservation notes
- Record deposits

---

## 4.4 Check-In Management

Features:

- Reservation check-in
- Walk-in guest check-in
- Room assignment
- Guest registration
- Occupant tracking
- Deposit recording
- Check-in timestamp recording

---

## 4.5 Stay Management

Features:

- View in-house guests
- Track stay details
- Manage occupants
- Room transfer
- Stay extension
- Guest request tracking
- Incident reporting

---

## 4.6 Billing and Folio Management

Each stay is assigned a **folio**, which acts as the billing ledger.

Features:

- Create folio
- Post charges
- Post payments
- Apply discounts
- Adjust charges
- Track balance
- Maintain transaction history

---

## 4.7 Payment Processing

Features:

- Accept multiple payment types
- Record partial payments
- Record deposits
- Apply payments to folio
- Track payment history

Payment methods may include:

- Cash
- Credit Card
- Bank Transfer
- E-wallet

---

## 4.8 Check-Out Processing

Features:

- Generate final bill
- Review charges
- Apply deposits
- Record final payment
- Generate receipt
- Mark stay as completed
- Release room

---

# 5. System Entities (Database Tables)

## 5.1 Guest Tables

### Guests

Stores guest master profile.

Fields:

- Id
- GuestCode
- FirstName
- LastName
- MiddleName
- DateOfBirth
- Gender
- Email
- Phone
- Nationality
- Notes

---

### GuestIdentifications

Stores guest ID documents.

Fields:

- Id
- GuestId
- IdentificationType
- IdentificationNumber
- ExpiryDate
- IssuedDate

---

# 6. Room Tables

### RoomTypes

Fields:

- Id
- Name
- Description
- MaxAdults
- MaxChildren
- BaseRate

---

### Rooms

Fields:

- Id
- RoomNumber
- RoomTypeId
- Floor
- Status

---

### RoomStatusLogs

Tracks status history.

Fields:

- Id
- RoomId
- Status
- ChangedAt

---

# 7. Reservation Tables

### Reservations

Fields:

- Id
- ReservationNo
- GuestId
- ReservationDate
- ArrivalDate
- DepartureDate
- Nights
- Adults
- Children
- Status
- RatePlanId
- TotalAmount
- DepositRequired
- DepositPaid
- Notes

---

### ReservationRooms

Fields:

- Id
- ReservationId
- RoomTypeId
- RoomId
- ArrivalDate
- DepartureDate
- RatePerNight

---

### ReservationGuests

Fields:

- Id
- ReservationId
- GuestId
- IsPrimary

---

### ReservationDailyRates

Fields:

- Id
- ReservationRoomId
- StayDate
- Rate
- Tax
- Discount

---

### ReservationDeposits

Fields:

- Id
- ReservationId
- Amount
- PaymentMethod
- PaidDate

---

# 8. Stay Tables

### Stays

Fields:

- Id
- StayNo
- ReservationId
- GuestId
- CheckInDateTime
- ExpectedCheckOutDateTime
- ActualCheckOutDateTime
- Status
- AssignedRoomId

---

### StayGuests

Fields:

- Id
- StayId
- GuestId
- IsPrimary

---

### StayRooms

Fields:

- Id
- StayId
- RoomId
- AssignedAt
- ReleasedAt

---

### RoomTransfers

Fields:

- Id
- StayId
- FromRoomId
- ToRoomId
- TransferDate
- Reason

---

### StayExtensions

Fields:

- Id
- StayId
- OldDepartureDate
- NewDepartureDate
- ApprovedBy

---

# 9. Billing Tables

### Folios

Fields:

- Id
- StayId
- FolioNo
- Status
- Balance

---

### FolioTransactions

Universal ledger table.

Fields:

- Id
- FolioId
- TransactionDate
- TransactionType
- ChargeTypeId
- Description
- Quantity
- UnitPrice
- Amount
- TaxAmount
- DiscountAmount
- NetAmount
- IsVoided

Transaction Types:

- Charge
- Payment
- Discount
- Adjustment
- Refund

---

### ChargeTypes

Fields:

- Id
- Name
- Category
- IsRoomCharge

Examples:

- RoomCharge
- Minibar
- Laundry
- Restaurant
- Damage
- ServiceFee

---

### PaymentMethods

Fields:

- Id
- Name
- IsActive

Examples:

- Cash
- CreditCard
- BankTransfer
- EWallet

---

### FolioPayments

Fields:

- Id
- FolioId
- PaymentMethodId
- Amount
- PaidDate
- ReferenceNo

---

### FolioAdjustments

Fields:

- Id
- FolioId
- AdjustmentType
- Amount
- Reason

---

# 10. Check-Out Tables

### CheckOutRecords

Fields:

- Id
- StayId
- CheckOutDateTime
- TotalCharges
- TotalPayments
- TotalDiscounts
- BalanceDue
- SettledAmount

---

### Receipts

Fields:

- Id
- ReceiptNo
- StayId
- Amount
- IssuedDate

---

### ReceiptPayments

Fields:

- Id
- ReceiptId
- PaymentMethodId
- Amount

---

# 11. Operational Tables

### GuestRequests

Fields:

- Id
- StayId
- RequestType
- Description
- Status
- RequestedAt
- CompletedAt

---

### Incidents

Fields:

- Id
- StayId
- Description
- ReportedAt
- Resolution

---

### HousekeepingLogs

Fields:

- Id
- RoomId
- Status
- LoggedAt

---

# 12. MVP Scope (Initial Release)

The first version must include:

Guest Management  
Room Types  
Rooms  
Reservation Creation  
Reservation Search  
Check-In  
Walk-In Registration  
Stay Tracking  
Folio Ledger  
Charge Posting  
Payment Posting  
Check-Out Processing  
Room Status Updates

---

# 13. Future Enhancements

Planned features for later releases:

- Rate calendars
- Seasonal pricing
- Packages
- Restaurant POS integration
- Inventory integration
- Housekeeping workflow
- Channel manager integration
- Online booking
- Accounting integration
- Multi-property support

---

# End of Document