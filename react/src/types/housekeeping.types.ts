import type { HousekeepingStatus } from './room.types';

export enum HousekeepingTaskType {
  CheckoutCleaning = 1,
  StayoverCleaning = 2,
  PickupCleaning = 3,
  Inspection = 4,
}

export enum HousekeepingTaskStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface HousekeepingTaskDto {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  taskType: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
  taskDate: string;
}

export interface CreateHousekeepingTaskDto {
  roomId: string;
  taskType: HousekeepingTaskType;
  assignedToStaffId?: string;
  remarks?: string;
  taskDate?: string;
}

export interface UpdateHousekeepingTaskStatusDto {
  taskId: string;
  status: HousekeepingTaskStatus;
  assignedToStaffId?: string;
  remarks?: string;
}

export interface HousekeepingLogDto {
  id: string;
  roomId: string;
  roomNumber: string;
  oldStatus: HousekeepingStatus;
  newStatus: HousekeepingStatus;
  staffId?: string;
  staffName?: string;
  remarks?: string;
  loggedAt: string;
}

export interface CleaningBoardRoomDto {
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  floor?: string;
  housekeepingStatus: HousekeepingStatus;
  cleaningType: string;
  pendingTaskId?: string;
}
