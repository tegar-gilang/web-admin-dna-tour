import { apiClient } from './apiClient';
import { Mutawif } from '../store';

export interface BackendMutawif {
  id: string;
  code: string;
  name: string;
  language: string;
  experience: string | null;
  status: 'active' | 'standby';
  kloters?: Array<{
    id: string;
    name: string;
    code: string;
    pivot?: {
      assigned_at: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}

export interface MutawifPayload {
  name: string;
  language: string;
  experience?: string | null;
  status: 'active' | 'standby';
}

export const mutawifService = {
  async getMutawifs(): Promise<Mutawif[]> {
    const response = await apiClient<{ data: BackendMutawif[] }>('/mutawifs');
    return response.data.map(mapBackendToMutawif);
  },

  async getMutawifById(id: string): Promise<Mutawif> {
    const response = await apiClient<{ data: BackendMutawif }>(`/mutawifs/${id}`);
    return mapBackendToMutawif(response.data);
  },

  async createMutawif(payload: MutawifPayload): Promise<Mutawif> {
    const response = await apiClient<{ data: BackendMutawif }>('/mutawifs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendToMutawif(response.data);
  },

  async updateMutawif(id: string, payload: Partial<MutawifPayload>): Promise<Mutawif> {
    const response = await apiClient<{ data: BackendMutawif }>(`/mutawifs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendToMutawif(response.data);
  },

  async deleteMutawif(id: string): Promise<void> {
    await apiClient(`/mutawifs/${id}`, {
      method: 'DELETE',
    });
  },

  async assignMutawifToKloter(mutawifId: string, kloterId: string): Promise<void> {
    await apiClient(`/mutawifs/${mutawifId}/kloters/${kloterId}`, {
      method: 'POST',
    });
  },

  async unassignMutawifFromKloter(mutawifId: string, kloterId: string): Promise<void> {
    await apiClient(`/mutawifs/${mutawifId}/kloters/${kloterId}`, {
      method: 'DELETE',
    });
  }
};

function mapBackendToMutawif(backend: BackendMutawif): Mutawif {
  // Determine if it has kloters
  const kloters = backend.kloters || [];
  
  // Format for backward compatibility
  const groupNames = kloters.map(k => k.name);
  const groupString = groupNames.length > 0 ? groupNames.join(', ') : 'Unassigned';

  return {
    id: backend.code || backend.id, // Keep code as standard ID for the table mapping if present
    backendId: backend.id, // Store real UUID
    code: backend.code,
    name: backend.name,
    language: backend.language || '-',
    experience: backend.experience || '-',
    group: groupString, 
    status: backend.status === 'active' ? 'Active' : backend.status === 'standby' ? 'Standby' : 'Active',
    kloterIds: kloters.map(k => k.id),
    kloters: kloters.map(k => ({
      id: k.id,
      code: k.code,
      name: k.name,
      assigned_at: k.pivot?.assigned_at || '',
    }))
  };
}
