import { apiClient } from '@/core/services/apiClient';

export type BroadcastPriority = 'normal' | 'urgent';
export type BroadcastCategory = 'general' | 'ibadah' | 'ziarah' | 'logistik' | 'darurat' | string;
export type BroadcastTargetType = 'all' | 'kloter';
export type BroadcastStatus = 'draft' | 'published' | 'archived';

export interface KloterRecipient {
  id: string;
  code: string;
  name: string;
}

export interface BroadcastModel {
  id: string;
  title: string;
  sender_type: string;
  sender_id: string;
  message: string;
  category: BroadcastCategory;
  priority: BroadcastPriority;
  target_type: BroadcastTargetType;
  status: BroadcastStatus;
  idempotency_key?: string | null;
  sent_at: string;
  created_at?: string;
  updated_at?: string;
  recipient_kloters?: KloterRecipient[];
}

export interface BroadcastStats {
  total_recipients: number;
  read_count: number;
  unread_count: number;
}

export interface PaginatedBroadcastResponse {
  current_page: number;
  data: BroadcastModel[];
  last_page: number;
  per_page: number;
  total: number;
}

interface BroadcastListApiResponse {
  message: string;
  data: PaginatedBroadcastResponse;
}

interface BroadcastDetailApiResponse {
  message: string;
  data: {
    broadcast: BroadcastModel;
    stats: BroadcastStats;
  };
}

interface CreateBroadcastApiResponse {
  message: string;
  data: {
    broadcast: BroadcastModel;
    recipients_count: number;
    notifications_queued: number;
  };
}

interface UpdateBroadcastApiResponse {
  message: string;
  data: BroadcastModel;
}

export interface CreateBroadcastPayload {
  title: string;
  message: string;
  category?: BroadcastCategory;
  priority?: BroadcastPriority;
  target_type: BroadcastTargetType;
  kloter_ids?: string[];
  send_to_family?: boolean;
}

export interface UpdateBroadcastPayload {
  title?: string;
  message?: string;
  category?: BroadcastCategory;
  priority?: BroadcastPriority;
}

export interface BroadcastQueryParams {
  page?: number;
  per_page?: number;
}

export const broadcastService = {
  /**
   * Mengambil daftar siaran dengan pagination server-side
   */
  async getBroadcasts(params: BroadcastQueryParams = {}): Promise<PaginatedBroadcastResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.per_page) query.append('per_page', params.per_page.toString());

    const qs = query.toString();
    const endpoint = `/broadcasts${qs ? `?${qs}` : ''}`;

    const response = await apiClient<BroadcastListApiResponse>(endpoint);
    return response.data;
  },

  /**
   * Mengambil detail siaran dan statistik keterbacaan
   */
  async getBroadcastById(id: string): Promise<{ broadcast: BroadcastModel; stats: BroadcastStats }> {
    const response = await apiClient<BroadcastDetailApiResponse>(`/broadcasts/${encodeURIComponent(id)}`);
    return response.data;
  },

  /**
   * Menerbitkan siaran baru dengan X-Idempotency-Key
   */
  async createBroadcast(
    payload: CreateBroadcastPayload,
    idempotencyKey?: string
  ): Promise<{ broadcast: BroadcastModel; recipients_count: number; notifications_queued: number }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const response = await apiClient<CreateBroadcastApiResponse>('/broadcasts', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  /**
   * Memperbarui informasi catatan broadcast yang sudah terbit (audit trail)
   */
  async updateBroadcast(id: string, payload: UpdateBroadcastPayload): Promise<BroadcastModel> {
    const response = await apiClient<UpdateBroadcastApiResponse>(`/broadcasts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return response.data;
  },
};
