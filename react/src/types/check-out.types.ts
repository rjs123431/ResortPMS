export interface CheckOutResultDto {
  checkOutRecordId: string;
  stayId: string;
  stayNo: string;
  receiptId: string;
  receiptNo: string;
  totalCharged: number;
  totalPaid: number;
  balanceDue: number;
}

export interface CheckOutRecordDto {
  id: string;
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  checkOutDateTime: string;
  totalCharges: number;
  totalPayments: number;
  totalDiscounts: number;
  balanceDue: number;
  settledAmount: number;
  receipt: ReceiptDto | null;
}

export interface CheckOutStatementDto {
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  checkInDateTime: string;
  expectedCheckOutDateTime: string;
  folioId: string;
  folioNo: string;
  folioStatus: number;
  totalCharges: number;
  totalDiscounts: number;
  totalPayments: number;
  balanceDue: number;
  overPayment: number;
  stayRooms?: StayRoomRecordDto[];
  transactions?: StatementLineDto[];
  payments?: StatementPaymentDto[];
}

export interface StayRoomRecordDto {
  stayRoomId: string;
  roomId: string;
  roomNumber: string;
  assignedAt: string;
  releasedAt?: string;
  isCleared: boolean;
  clearedAt?: string;
  clearedByStaffId?: string;
  clearedByStaffName?: string;
}

export interface ClearStayRoomDto {
  stayRoomId: string;
  staffId?: string;
}

export interface StatementLineDto {
  date: string;
  description: string;
  chargeTypeName?: string;
  type: string;
  amount: number;
}

export interface StatementPaymentDto {
  date: string;
  paymentMethodName?: string;
  amount: number;
  referenceNo?: string;
}

export interface ReceiptPaymentDto {
  paymentMethodId: string;
  paymentMethodName?: string;
  amount: number;
}

export interface ReceiptDto {
  id: string;
  receiptNo: string;
  stayId: string;
  stayNo?: string;
  guestName?: string;
  roomNumber?: string;
  issuedDate: string;
  amount: number;
  payments: ReceiptPaymentDto[];
}
