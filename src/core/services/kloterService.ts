import { apiClient } from './apiClient';
import { Group } from '../store';

export interface BackendKloter {
  id: string;
  name: string;
  code: string;
  flight_code?: string;
  departure_date?: string;
  return_date?: string;
  status: string;
  tour_leader?: string;
  mutawif_local?: string;
  jamaah_count?: number;
}

export const kloterService = {
  async getKloters(): Promise<Group[]> {
    const response = await apiClient<{ data: BackendKloter[] }>('/kloters');
    return response.data.map(mapBackendToGroup);
  }
};

function mapBackendToGroup(backend: BackendKloter): Group {
  return {
    id: backend.id,
    name: backend.name,
    kloter: backend.code || backend.name,
    pilgrims: backend.jamaah_count || 0,
    tourLeader: backend.tour_leader || '-',
    mutawif: backend.mutawif_local || '-',
    status: backend.status || 'draft'
  };
}
