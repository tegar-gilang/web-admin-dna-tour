import { apiClient } from './apiClient';
import { Package } from '../store';

export interface BackendPackage {
  id: string;
  name: string;
  category: string;
  status: string;
  is_featured: boolean;
  published_at?: string;
  created_by?: string;
}

export const packageService = {
  async getPackages(): Promise<Package[]> {
    const response = await apiClient<{ data: BackendPackage[] }>('/packages');
    return response.data.map(mapBackendToPackage);
  }
};

function mapBackendToPackage(backend: BackendPackage): Package {
  return {
    id: backend.id,
    name: backend.name,
    category: backend.category || '-',
    status: backend.status || 'draft',
    isFeatured: backend.is_featured || false
  };
}
