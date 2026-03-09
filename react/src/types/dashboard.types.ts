export interface DashboardEventsDto {
  id: number;
  title: string;
  description: string;
  type: string; // "Holiday", "Payroll", "Event"
  start: string; // yyyy-MM-dd format
  end?: string; // yyyy-MM-dd format
  eventDate?: string;
}

export interface GetDashboardEventsInput {
  startDate: string;
  endDate: string;
}

export interface DashboardBirthdaysDto {
  id: number;
  name: string;
  dateOfBirth: string;
}

export interface DashboardMetricsDto {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  pendingApprovals: number;
}
