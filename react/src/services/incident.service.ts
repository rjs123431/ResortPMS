import { api } from './api.service';
import {
  ApiResponse,
  CreateIncidentDto,
  IncidentDto,
  IncidentListDto,
  IncidentSeverity,
  IncidentStatus,
  PagedResultDto,
  ResolveIncidentDto,
} from '@/types/resort.types';

export const incidentService = {
  getIncidents: async (params?: {
    filter?: string;
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    stayId?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.severity !== undefined) query.Severity = String(params.severity);
    if (params?.stayId) query.StayId = params.stayId;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<IncidentListDto>>>(
      '/api/services/app/Incident/GetList',
      { params: query },
    );
    return response.data.result;
  },

  getIncident: async (id: string) => {
    const response = await api.get<ApiResponse<IncidentDto>>(
      '/api/services/app/Incident/Get',
      { params: { id } },
    );
    return response.data.result;
  },

  createIncident: async (input: CreateIncidentDto) => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/Incident/Create',
      input,
    );
    return response.data.result;
  },

  updateIncident: async (input: CreateIncidentDto & { id: string }) => {
    await api.put('/api/services/app/Incident/Update', input);
  },

  resolveIncident: async (input: ResolveIncidentDto) => {
    await api.post('/api/services/app/Incident/Resolve', input);
  },

  closeIncident: async (id: string) => {
    await api.post('/api/services/app/Incident/Close', null, { params: { id } });
  },

  deleteIncident: async (id: string) => {
    await api.delete('/api/services/app/Incident/Delete', { params: { id } });
  },
};
