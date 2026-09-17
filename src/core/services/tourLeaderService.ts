import { apiClient } from './apiClient';

export interface BackendTourLeaderKloter {
  id: string;
  name: string;
  code?: string;
}

export interface BackendTourLeader {
  id: string;
  login_id: string;
  name: string;
  phone?: string | null;
  certification_number?: string | null;
  experience?: string | null;
  performance?: string | null;
  status: string;
  kloters?: BackendTourLeaderKloter[];
  created_at?: string;
  updated_at?: string;
}

export interface TourLeaderKloter {
  id: string;
  code?: string;
  name: string;
}

export interface TourLeader {
  id: string;
  backendId?: string;
  loginId?: string;
  name: string;
  phone: string;
  group: string;
  experience?: string;
  performance?: string;
  status: 'Active' | 'Resting' | 'Standby' | string;
  certification_number?: string | null;
  kloters?: TourLeaderKloter[];
}

export interface CreateTourLeaderPayload {
  loginId: string;
  name: string;
  phone?: string;
  experience?: string;
  performance?: string;
  status: string;
}

export interface UpdateTourLeaderPayload {
  loginId?: string;
  name?: string;
  phone?: string;
  experience?: string;
  performance?: string;
  status?: string;
}

export const tourLeaderService = {
  async getTourLeaders(params?: { q?: string; status?: string }): Promise<TourLeader[]> {
    const queryParts: string[] = [];
    if (params?.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
    if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiClient<{ message: string; data: BackendTourLeader[] }>(`/tour-leaders${queryString}`);

    return (response.data || []).map(mapBackendToTourLeader);
  },

  async getTourLeaderById(backendId: string): Promise<TourLeader> {
    const response = await apiClient<{ message: string; data: BackendTourLeader }>(`/tour-leaders/${backendId}`);
    return mapBackendToTourLeader(response.data);
  },

  async createTourLeader(payload: CreateTourLeaderPayload): Promise<TourLeader> {
    const response = await apiClient<{ message: string; data: BackendTourLeader }>('/tour-leaders', {
      method: 'POST',
      body: JSON.stringify({
        login_id: payload.loginId,
        full_name: payload.name,
        phone: payload.phone || null,
        experience: payload.experience || null,
        performance: payload.performance || null,
        status: mapUIStatusToBackend(payload.status),
      }),
    });

    return mapBackendToTourLeader(response.data);
  },

  async updateTourLeader(backendId: string, payload: UpdateTourLeaderPayload): Promise<TourLeader> {
    const body: Record<string, any> = {};
    if (payload.loginId !== undefined) body.login_id = payload.loginId;
    if (payload.name !== undefined) body.full_name = payload.name;
    if (payload.phone !== undefined) body.phone = payload.phone || null;
    if (payload.experience !== undefined) body.experience = payload.experience || null;
    if (payload.performance !== undefined) body.performance = payload.performance || null;
    if (payload.status !== undefined) body.status = mapUIStatusToBackend(payload.status);

    const response = await apiClient<{ message: string; data: BackendTourLeader }>(`/tour-leaders/${backendId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return mapBackendToTourLeader(response.data);
  },

  async deleteTourLeader(backendId: string): Promise<void> {
    await apiClient(`/tour-leaders/${backendId}`, {
      method: 'DELETE',
    });
  },

  async assignKloter(backendId: string, kloterId: string): Promise<TourLeader> {
    const response = await apiClient<{ message: string; data: BackendTourLeader }>(
      `/tour-leaders/${backendId}/kloters/${kloterId}`,
      { method: 'POST' }
    );
    return mapBackendToTourLeader(response.data);
  },

  async unassignKloter(backendId: string, kloterId: string): Promise<void> {
    await apiClient(`/tour-leaders/${backendId}/kloters/${kloterId}`, {
      method: 'DELETE',
    });
  },

  async deleteTourLeaderWithUnassign(leader: TourLeader): Promise<void> {
    const targetId = leader.backendId || leader.id;
    if (leader.kloters && leader.kloters.length > 0) {
      for (const kloter of leader.kloters) {
        await this.unassignKloter(targetId, kloter.id);
      }
    }
    await this.deleteTourLeader(targetId);
  },
};

export function mapBackendToTourLeader(backend: BackendTourLeader): TourLeader {
  const kloters: TourLeaderKloter[] = (backend.kloters || []).map((k) => ({
    id: k.id,
    name: k.name,
    code: k.code,
  }));

  let groupDisplay = 'Belum Ditugaskan';
  if (kloters.length > 0) {
    groupDisplay = kloters.map((k) => k.name).join(', ');
  }

  const loginId = backend.login_id || backend.id;

  return {
    id: loginId,
    backendId: backend.id,
    loginId: loginId,
    name: backend.name,
    phone: backend.phone || '',
    group: groupDisplay,
    experience: backend.experience || '',
    performance: backend.performance || '',
    status: mapBackendStatusToUI(backend.status),
    certification_number: backend.certification_number || null,
    kloters,
  };
}

export function mapBackendStatusToUI(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'resting':
      return 'Resting';
    case 'standby':
      return 'Standby';
    default:
      return 'Active';
  }
}

export function mapUIStatusToBackend(status: string): string {
  switch (status) {
    case 'Active':
    case 'Aktif':
      return 'active';
    case 'Resting':
    case 'Istirahat':
      return 'resting';
    case 'Standby':
    case 'Siaga':
      return 'standby';
    default:
      return 'active';
  }
}
