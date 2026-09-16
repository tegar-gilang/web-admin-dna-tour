import { apiClient } from './apiClient';
import { Group } from '../store';

export interface BackendKloter {
  id: string;
  name: string;
  code: string;
  flight_code?: string;
  package_id?: string | null;
  hotel_makkah_id?: string | null;
  hotel_madinah_id?: string | null;
  departure_date?: string;
  return_date?: string;
  status: string;
  tour_leader?: string;
  mutawif_local?: string;
  jamaah_count?: number;
}

export interface KloterPayload {
  name: string;
  code?: string | null;
  flight_code?: string | null;
  package_id?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  hotel_makkah_id?: string | null;
  hotel_madinah_id?: string | null;
  status?: 'draft' | 'active' | 'archived';
  tour_leader?: string | null;
  mutawif_local?: string | null;
}

export const kloterService = {
  async getKloters(): Promise<Group[]> {
    const response = await apiClient<{ data: BackendKloter[] }>('/kloters');

    return response.data.map(mapBackendToGroup);
  },

  async getKloter(id: string): Promise<Group> {
    const response = await apiClient<{ data: BackendKloter }>(
      `/kloters/${id}`
    );

    return mapBackendToGroup(response.data);
  },

  async createKloter(payload: KloterPayload): Promise<Group> {
    const response = await apiClient<{ data: BackendKloter }>(
      '/kloters',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendToGroup(response.data);
  },

  async updateKloter(
    id: string,
    payload: Partial<KloterPayload>
  ): Promise<Group> {
    const response = await apiClient<{ data: BackendKloter }>(
      `/kloters/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    return mapBackendToGroup(response.data);
  },

  async deleteKloter(id: string): Promise<void> {
    await apiClient(`/kloters/${id}`, {
      method: 'DELETE',
    });
  },
};

function mapBackendToGroup(backend: BackendKloter): Group {
  return {
    id: backend.code || backend.id,
    backendId: backend.id,
    name: backend.name,
    kloter: backend.flight_code || backend.code || '',
    pilgrims: backend.jamaah_count || 0,
    tourLeader: backend.tour_leader || '-',
    mutawif: backend.mutawif_local || '-',
    status: mapBackendStatusToUI(backend.status),
    hotelMakkahId: backend.hotel_makkah_id || null,
    hotelMadinahId: backend.hotel_madinah_id || null,
  };
}

function mapBackendStatusToUI(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'archived':
      return 'Archived';
    case 'draft':
    default:
      return 'Draft';
  }
}