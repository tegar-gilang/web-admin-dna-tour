import { apiClient } from './apiClient';
import { Schedule } from '../store';

export interface BackendSchedule {
  id: number;
  day_number: number | null;
  date: string;
  time: string;
  end_time: string | null;
  inferred_end_time?: string | null;
  effective_end_time?: string | null;
  effective_end_datetime?: string | null;
  title: string;
  category: string | null;
  location: string | null;
  keterangan: string | null;
  pic: string | null;
  status?: 'upcoming' | 'in_progress' | 'completed';
  status_override?: 'upcoming' | 'in_progress' | 'completed' | null;
  status_mode?: 'auto' | 'manual';
  status_updated_by_type?: string | null;
  status_updated_by_id?: string | null;
  status_updated_at?: string | null;
  reminder_status?: 'draft' | 'published';
  broadcasted_at?: string | null;
  broadcasted_by_type?: string | null;
  broadcasted_by_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendScheduleResponse {
  message?: string;
  data: BackendSchedule | BackendSchedule[];
}

export interface BroadcastScheduleResponse {
  message?: string;
  data: {
    schedule: BackendSchedule;
    broadcast: {
      schedule_id: number;
      reminder_status: 'published';
      broadcasted_at: string;
      broadcasted_by_type: string;
      broadcasted_by_id: string;
      recipients_count: number;
      notifications_queued: number;
    };
  };
}

export interface ScheduleQueryParams {
  q?: string;
  category?: string;
  date?: string;
  day_number?: number;
}

export interface SchedulePayload {
  day_number?: number;
  date: string;
  time: string;
  end_time?: string | null;
  title: string;
  category?: string | null;
  location?: string | null;
  keterangan?: string | null;
  pic?: string | null;
  status_override?: 'upcoming' | 'in_progress' | 'completed' | null;
  status_mode?: 'auto' | 'manual';
}

/**
 * Maps backend Schedule resource to UI Schedule model
 */
export function mapBackendScheduleToUI(backend: BackendSchedule): Schedule {
  return {
    id: String(backend.id),
    dayNumber: backend.day_number ?? 1,
    date: backend.date,
    time: backend.time ? backend.time.substring(0, 5) : '',
    endTime: backend.end_time ? backend.end_time.substring(0, 5) : undefined,
    inferredEndTime: backend.inferred_end_time ? backend.inferred_end_time.substring(0, 5) : undefined,
    effectiveEndTime: backend.effective_end_time ? backend.effective_end_time.substring(0, 5) : undefined,
    effectiveEndDatetime: backend.effective_end_datetime || undefined,
    title: backend.title,
    category: backend.category || undefined,
    location: backend.location || '',
    keterangan: backend.keterangan || '',
    pic: backend.pic || undefined,
    status: backend.status,
    statusOverride: backend.status_override || undefined,
    statusMode: backend.status_mode || 'auto',
    statusUpdatedByType: backend.status_updated_by_type || undefined,
    statusUpdatedById: backend.status_updated_by_id || undefined,
    statusUpdatedAt: backend.status_updated_at || undefined,
    reminderStatus: backend.reminder_status || 'draft',
    broadcastedAt: backend.broadcasted_at || undefined,
    broadcastedByType: backend.broadcasted_by_type || undefined,
    broadcastedById: backend.broadcasted_by_id || undefined,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

/**
 * Maps UI Schedule object to backend request body
 */
export function mapUIToBackendPayload(ui: Partial<Schedule>): SchedulePayload {
  return {
    day_number: ui.dayNumber ?? 1,
    date: ui.date || new Date().toISOString().split('T')[0],
    time: ui.time ? (ui.time.length === 5 ? ui.time : ui.time.substring(0, 5)) : '00:00',
    end_time: ui.endTime ? (ui.endTime.length === 5 ? ui.endTime : ui.endTime.substring(0, 5)) : null,
    title: ui.title || '',
    category: ui.category || null,
    location: ui.location || null,
    keterangan: ui.keterangan || null,
    pic: ui.pic || null,
    status_override: ui.statusOverride || null,
    status_mode: ui.statusMode,
  };
}

export const journeyService = {
  /**
   * Fetch all schedules with optional query filters (q, category, date, day_number)
   */
  getSchedules: async (params?: ScheduleQueryParams): Promise<Schedule[]> => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.date) query.append('date', params.date);
    if (params?.day_number) query.append('day_number', String(params.day_number));

    const queryString = query.toString();
    const endpoint = `/schedules${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient<any>(endpoint);
    const rawData = response?.data ?? response;
    const items: BackendSchedule[] = Array.isArray(rawData) ? rawData : [];

    return items.map(mapBackendScheduleToUI);
  },

  /**
   * Fetch single schedule by ID
   */
  getScheduleById: async (id: string | number): Promise<Schedule> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    const response = await apiClient<any>(`/schedules/${numericId}`);
    const item: BackendSchedule = response?.data ?? response;
    return mapBackendScheduleToUI(item);
  },

  /**
   * Create a new schedule entry
   */
  createSchedule: async (payload: Partial<Schedule>): Promise<Schedule> => {
    const backendPayload = mapUIToBackendPayload(payload);
    const response = await apiClient<any>('/schedules', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
    const item: BackendSchedule = response?.data ?? response;
    return mapBackendScheduleToUI(item);
  },

  /**
   * Update an existing schedule entry
   */
  updateSchedule: async (id: string | number, payload: Partial<Schedule>): Promise<Schedule> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    const backendPayload = mapUIToBackendPayload(payload);
    const response = await apiClient<any>(`/schedules/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });
    const item: BackendSchedule = response?.data ?? response;
    return mapBackendScheduleToUI(item);
  },

  /**
   * Update execution status of a schedule
   * mode: 'manual' (with statusOverride) or 'auto' (reverts to timeline auto evaluation)
   */
  updateScheduleStatus: async (
    id: string | number,
    statusOverride?: 'upcoming' | 'in_progress' | 'completed' | null,
    mode: 'auto' | 'manual' = statusOverride ? 'manual' : 'auto'
  ): Promise<Schedule> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    const payload: { status_override?: string | null; mode: 'auto' | 'manual' } = {
      mode,
      status_override: mode === 'auto' ? null : statusOverride,
    };
    const response = await apiClient<any>(`/schedules/${numericId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const item: BackendSchedule = response?.data ?? response;
    return mapBackendScheduleToUI(item);
  },

  /**
   * Broadcast a schedule reminder to eligible recipients
   */
  broadcastSchedule: async (id: string | number): Promise<{ schedule: Schedule; recipientsCount: number; notificationsQueued: number }> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    const response = await apiClient<BroadcastScheduleResponse>(`/schedules/${numericId}/broadcast`, {
      method: 'POST',
    });
    const scheduleData = response?.data?.schedule ?? (response as any)?.schedule ?? response?.data;
    const broadcastMeta = response?.data?.broadcast;

    return {
      schedule: mapBackendScheduleToUI(scheduleData),
      recipientsCount: broadcastMeta?.recipients_count ?? 0,
      notificationsQueued: broadcastMeta?.notifications_queued ?? 0,
    };
  },

  /**
   * Delete a schedule entry
   */
  deleteSchedule: async (id: string | number): Promise<void> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    await apiClient(`/schedules/${numericId}`, {
      method: 'DELETE',
    });
  },
};
