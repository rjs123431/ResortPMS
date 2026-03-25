// ── Incidents ──────────────────────────────────────────────────────────────────

export enum IncidentStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3,
}

export enum IncidentSeverity {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export interface IncidentListDto {
  id: string;
  stayId: string;
  stayNo: string;
  guestName: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: string;
  reportedByName: string;
  reportedAt: string;
  resolvedAt?: string;
  creationTime: string;
}

export interface IncidentDto extends IncidentListDto {
  resolution: string;
}

export interface CreateIncidentDto {
  stayId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category?: string;
  reportedByName?: string;
}

export interface ResolveIncidentDto {
  id: string;
  resolution: string;
}
