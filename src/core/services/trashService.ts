import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// ====================
// TYPES & INTERFACES
// ====================

export type TrashEntityType = 'pendaftar' | 'jamaah';

export interface TrashExtraInfo {
  phone?: string | null;
  nik?: string | null;
  status?: string | null;
  [key: string]: any;
}

export interface TrashItemData {
  id: string; // e.g., "trash-pendaftar-{uuid}"
  original_id: string; // UUID
  type: string; // "Pendaftar" | "Jamaah"
  type_key: TrashEntityType;
  code: string;
  name: string;
  deleted_at: string;
  retention_deadline: string;
  days_left: number;
  is_warning: boolean;
  extra_info?: TrashExtraInfo;
}

export interface TrashSummary {
  total: number;
  total_pendaftar: number;
  total_jamaah: number;
  total_warning: number;
}

export interface TrashListResponse {
  message: string;
  data: TrashItemData[];
  summary: TrashSummary;
}

export interface TrashRestoreResponse {
  message: string;
  data?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface TrashDeleteResponse {
  success?: boolean;
  message: string;
}

export interface BulkDeleteItemResult {
  id: string;
  type: string;
  status: 'success' | 'failed';
  message: string;
}

export interface TrashBulkDeleteResponse {
  message: string;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
  results: BulkDeleteItemResult[];
}

export interface BulkDeletePayloadItem {
  type: string;
  id: string;
}

export interface ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
}

// ====================
// HELPER FETCH FUNCTION
// ====================

async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err: ApiError = new Error();
      err.status = response.status;

      if (response.status === 401) {
        authService.clearAuthSession();
        err.message = 'Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.';
        throw err;
      }

      if (response.status === 403) {
        err.message = data.message || 'Anda tidak memiliki hak akses (admin) untuk tindakan ini.';
        throw err;
      }

      if (response.status === 404) {
        err.message = data.message || 'Data tidak ditemukan di Riwayat Hapus.';
        throw err;
      }

      if (response.status === 422) {
        if (data.errors && typeof data.errors === 'object') {
          err.errors = data.errors;
          const errorMessages: string[] = [];
          Object.values(data.errors).forEach((val) => {
            if (Array.isArray(val)) {
              errorMessages.push(...val);
            } else if (typeof val === 'string') {
              errorMessages.push(val);
            }
          });
          if (errorMessages.length > 0) {
            err.message = errorMessages.join(' ');
            throw err;
          }
        }
        err.message = data.message || 'Validasi gagal atau terjadi konflik identifier.';
        throw err;
      }

      err.message = data.message || `Request gagal dengan status ${response.status}`;
      throw err;
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      const netErr: ApiError = new Error('Tidak dapat terhubung ke server backend (http://127.0.0.1:8000). Pastikan Laravel sudah berjalan.');
      netErr.status = 0;
      throw netErr;
    }
    throw err;
  }
}

// ====================
// TRASH SERVICE
// ====================

export const trashService = {
  /**
   * Mengambil daftar data yang ter-soft delete (Riwayat Penghapusan)
   */
  async getTrashItems(params?: { type?: string; q?: string }, signal?: AbortSignal): Promise<TrashListResponse> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') {
      query.append('type', params.type);
    }
    if (params?.q) {
      query.append('q', params.q);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<TrashListResponse>(`/trash${qs}`, { signal });
  },

  /**
   * Memulihkan item dari Riwayat Hapus
   */
  async restoreTrashItem(type: string, id: string): Promise<TrashRestoreResponse> {
    const normalizedType = type.toLowerCase();
    return apiFetch<TrashRestoreResponse>(`/trash/${normalizedType}/${id}/restore`, {
      method: 'POST',
    });
  },

  /**
   * Menghapus permanen satu data dari Riwayat Hapus
   */
  async deleteTrashPermanently(type: string, id: string): Promise<TrashDeleteResponse> {
    const normalizedType = type.toLowerCase();
    return apiFetch<TrashDeleteResponse>(`/trash/${normalizedType}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Menghapus permanen sekumpulan item (Bulk Delete)
   * Mendukung pemecahan batch (chunking) otomatis jika item > 100
   * Memutus eksekusi jika terjadi HTTP 401 atau 403 (otorisasi)
   */
  async bulkDeleteTrash(items: BulkDeletePayloadItem[]): Promise<TrashBulkDeleteResponse> {
    if (!items || items.length === 0) {
      return {
        message: 'Tidak ada item yang dipilih.',
        summary: { total: 0, success: 0, failed: 0 },
        results: [],
      };
    }

    const CHUNK_SIZE = 100;
    const batches: BulkDeletePayloadItem[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      batches.push(items.slice(i, i + CHUNK_SIZE));
    }

    let aggregatedSuccess = 0;
    let aggregatedFailed = 0;
    const aggregatedResults: BulkDeleteItemResult[] = [];
    let processedItemCount = 0;

    for (const batch of batches) {
      try {
        const res = await apiFetch<TrashBulkDeleteResponse>('/trash/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ items: batch }),
        });

        processedItemCount += batch.length;

        // Validasi respons: harus memiliki summary dan results
        if (res && res.summary && Array.isArray(res.results)) {
          aggregatedSuccess += (typeof res.summary.success === 'number' ? res.summary.success : 0);
          aggregatedFailed += (typeof res.summary.failed === 'number' ? res.summary.failed : 0);
          aggregatedResults.push(...res.results);
        } else {
          // Respons anomali tanpa summary/results yang valid: perlakukan batch ini sebagai failed
          aggregatedFailed += batch.length;
          batch.forEach((item) => {
            aggregatedResults.push({
              id: item.id,
              type: item.type,
              status: 'failed',
              message: 'Format respons backend tidak valid (summary/results tidak ditemukan).',
            });
          });
        }
      } catch (err: any) {
        // Hentikan batch jika terjadi error otorisasi (HTTP 401 atau 403)
        if (err.status === 401 || err.status === 403) {
          // Jangan tambahkan batch ini maupun batch berikutnya ke processed item count
          err.aggregatedSummary = {
            total: processedItemCount,
            success: aggregatedSuccess,
            failed: aggregatedFailed,
          };
          err.aggregatedResults = aggregatedResults;
          throw err;
        }

        // Untuk kegagalan HTTP 500, network error, dsb.: catat batch ini sebagai failed dan lanjut ke batch berikutnya
        processedItemCount += batch.length;
        aggregatedFailed += batch.length;
        batch.forEach((item) => {
          aggregatedResults.push({
            id: item.id,
            type: item.type,
            status: 'failed',
            message: err.message || 'Gagal memproses batch penghapusan permanen.',
          });
        });
      }
    }

    return {
      message: 'Proses penghapusan permanen selesai.',
      summary: {
        total: processedItemCount,
        success: aggregatedSuccess,
        failed: aggregatedFailed,
      },
      results: aggregatedResults,
    };
  },
};
