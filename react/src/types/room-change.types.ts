import type { HousekeepingStatus } from './room.types';

// ── Room Change Request Types ──────────────────────────────────────────────────

export enum RoomChangeSource {
  GuestRequest = 1,
  Internal = 2,
  Maintenance = 3,
  Upgrade = 4,
  Downgrade = 5,
}

export enum RoomChangeReason {
  GuestPreference = 1,
  RoomIssue = 2,
  Maintenance = 3,
  Noise = 4,
  ViewChange = 5,
  Accessibility = 6,
  FamilyReunion = 7,
  Upgrade = 8,
  Downgrade = 9,
  Overbooking = 10,
  Other = 99,
}

export enum RoomChangeRequestStatus {
  Pending = 1,
  Approved = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
  Rejected = 6,
}

export interface CreateRoomChangeRequestDto {
  stayId: string;
  stayRoomId?: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  reasonDetails?: string;
  preferredRoomTypeId?: string;
  preferredRoomId?: string;
}

export interface ApproveRoomChangeRequestDto {
  requestId: string;
  toRoomId: string;
}

export interface RejectRoomChangeRequestDto {
  requestId: string;
  rejectionReason: string;
}

export interface CancelRoomChangeRequestDto {
  requestId: string;
  cancellationReason?: string;
}

export interface ExecuteRoomChangeDto {
  requestId: string;
}

export interface RoomChangeRequestDto {
  id: string;
  stayId: string;
  stayNo: string;
  guestName: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  reasonDetails?: string;
  fromRoomNumber: string;
  fromRoomTypeName: string;
  toRoomNumber?: string;
  toRoomTypeName?: string;
  preferredRoomTypeName?: string;
  status: RoomChangeRequestStatus;
  requestedAt: string;
  requestedBy: string;
  approvedAt?: string;
  approvedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface RoomChangeRequestListDto {
  id: string;
  stayNo: string;
  guestName: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  fromRoomNumber: string;
  toRoomNumber?: string;
  status: RoomChangeRequestStatus;
  requestedAt: string;
}

export interface AvailableRoomForChangeDto {
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  baseRate: number;
  floor?: string;
  housekeepingStatus: HousekeepingStatus;
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSameType: boolean;
}
