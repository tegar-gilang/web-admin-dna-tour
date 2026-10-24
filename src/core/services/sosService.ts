
import { apiClient } from '@/core/services/apiClient';

export type SosStatus =
  | 'triggered'
  | 'acknowledged'
  | 'in_action'
  | 'resolved'
  | 'false_alarm';

export interface SosPerson {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface SosKloter {
  id: string;
  name: string;
}

export interface SosIncident {
  id: string;
  jamaah_id: string;
  kloter_id: string;
  latitude: string | number | null;
  longitude: string | number | null;
  status: SosStatus;
  triggered_at: string;
  type: string;
  description: string | null;
  location_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  responses_count: number;
  jamaah: SosPerson | null;
  kloter: SosKloter | null;
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
