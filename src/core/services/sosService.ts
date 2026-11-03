import { apiClient } from '@/core/services/apiClient';

export type SosStatus =
  | 'triggered'
  | 'acknowledged'
  | 'in_action'
  | 'resolved'
  | 'false_alarm';

export type SosType = 'critical' | 'health' | 'accident' | 'lost' | string;

export interface SosPerson {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface SosKloter {
  id: string;
  name: string;
}

export interface SosResponseItem {
  id: string;
  sos_incident_id: string;
  message: string;
  created_at: string;
  jamaah?: { id: string; full_name: string } | null;
  tour_leader?: { id: string; full_name: string } | null;
  internal_user?: { id: string; full_name: string } | null;
}

export interface SosStatusHistoryItem {
  id: string;
  sos_incident_id: string;
  old_status: SosStatus | null;
  new_status: SosStatus;
  reason: string | null;
  changed_at: string;
  tour_leader?: { id: string; full_name: string } | null;
  internal_user?: { id: string; full_name: string } | null;
}

export interface SosIncident {
  id: string;
  jamaah_id: string;
  kloter_id: string;
  latitude: string | number | null;
  longitude: string | number | null;
  status: SosStatus;
  triggered_at: string;
  type: SosType;
  description: string | null;
  location_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  responses_count?: number;
  jamaah: SosPerson | null;
  kloter: SosKloter | null;
  responses?: SosResponseItem[];
  status_histories?: SosStatusHistoryItem[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

interface SosListResponse {
  message: string;
  data: PaginatedResponse<SosIncident>;
}

interface SosDetailResponse {
  data: SosIncident;
}

interface SosStatusResponse {
  message: string;
  data: SosIncident;
}

export interface CreateSosIncidentPayload {
  jamaah_id: string;
  type: 'critical' | 'health' | 'accident' | 'lost';
  description?: string | null;
  location_name?: string | null;
  latitude: number;
  longitude: number;
}

export async function getSosIncidents(
  page = 1,
): Promise<PaginatedResponse<SosIncident>> {
  const response = await apiClient<SosListResponse>(
    `/sos-incidents?page=${page}`,
  );

  return response.data;
}

export async function getSosIncident(
  id: string,
): Promise<SosIncident> {
  const response = await apiClient<SosDetailResponse>(
    `/sos-incidents/${encodeURIComponent(id)}`,
  );

  return response.data;
}

export async function updateSosStatus(
  id: string,
  status: SosStatus,
  reason?: string,
): Promise<SosIncident> {
  const response = await apiClient<SosStatusResponse>(
    `/sos-incidents/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(status === 'false_alarm' ? { reason } : {}),
      }),
    },
  );

  return response.data;
}

export async function createSosIncident(
  payload: CreateSosIncidentPayload,
): Promise<SosIncident> {
  const response = await apiClient<{ message: string; data: SosIncident }>(
    '/sos-incidents',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return response.data;
}
