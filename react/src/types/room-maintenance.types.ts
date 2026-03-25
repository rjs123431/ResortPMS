export enum RoomMaintenancePriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum RoomMaintenanceStatus {
  Open = 1,
  Assigned = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum MaintenanceCategory {
  Reactive = 1,
  Preventive = 2,
}

export interface RoomMaintenanceTypeDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateUpdateRoomMaintenanceTypeDto {
  name: string;
  description: string;
  isActive: boolean;
}

export interface RoomMaintenanceRequestDto {
  id: string;
  roomId: string;
  roomNumber: string;
  assignedStaffId?: string;
  assignedStaffName: string;
  title: string;
  description: string;
  priority: RoomMaintenancePriority;
  status: RoomMaintenanceStatus;
  category: MaintenanceCategory;
  startDate: string;
  endDate: string;
  openedAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason: string;
  typeIds: string[];
  typeNames: string[];
}

export interface CreateRoomMaintenanceRequestDto {
  roomId: string;
  assignedStaffId?: string;
  title: string;
  description: string;
  priority: RoomMaintenancePriority;
  category: MaintenanceCategory;
  startDate: string;
  endDate: string;
  typeIds: string[];
}
