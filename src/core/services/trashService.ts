import { apiClient } from './apiClient';

export interface TrashItemBackend {
  id: string;
  original_id: string;
  type: string;
  type_key: string;
  code: string;
  name: string;
  deleted_at: string;
  retention_deadline: string;
  days_left: number;
  is_warning: boolean;
  extra_info?: {
    phone?: string | null;
    nik?: string | null;
    status?: string | null;
  };
}

export interface TrashResponse {
  message: string;
  data: TrashItemBackend[];
  summary: {
    total: number;
    total_pendaftar: number;
    total_jamaah: number;
    total_warning: number;
  };
}

export const trashService = {
  /**
   * Mengambil daftar data yang terhapus (Soft Delete) dari backend
   */
  async getTrashItems(params?: { q?: string; type?: string }): Promise<TrashResponse> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.type && params.type !== 'all') query.append('type', params.type);

    const queryString = query.toString();
    const endpoint = queryString ? `/trash?${queryString}` : '/trash';

    return await apiClient<TrashResponse>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Memulihkan record dari Riwayat Hapus
   */
  async restoreTrashItem(typeKey: string, originalId: string): Promise<{ message: string; data: any }> {
    return await apiClient<{ message: string; data: any }>(`/trash/${typeKey}/${originalId}/restore`, {
      method: 'POST',
    });
  },
};

export default trashService;
