import { apiClient } from './apiClient';
import { Schedule } from '../store';

export interface BackendSchedule {
  id: number;
  day_number: number;
  date: string;
  time: string;
  title: string;
  category: string | null;
  location: string | null;
  keterangan: string | null;
  pic: string | null;
  status?: 'upcoming' | 'in_progress' | 'completed';
  status_override?: 'upcoming' | 'in_progress' | 'completed' | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendScheduleResponse {
  message?: string;
  data: BackendSchedule | BackendSchedule[];
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
  title: string;
  category?: string | null;
  location?: string | null;
  keterangan?: string | null;
  pic?: string | null;
  status_override?: 'upcoming' | 'in_progress' | 'completed' | null;
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
    title: backend.title,
    category: backend.category || undefined,
    location: backend.location || '',
    keterangan: backend.keterangan || '',
    pic: backend.pic || undefined,
    status: backend.status,
    statusOverride: backend.status_override || undefined,
  };
}

/**
 * Maps UI Schedule object to backend request body
 */
export function mapUIToBackendPayload(ui: Partial<Schedule>): SchedulePayload {
  return {
    day_number: ui.dayNumber ?? 1,
    date: ui.date || new Date().toISOString().split('T')[0],
    time: ui.time || '00:00',
    title: ui.title || '',
    category: ui.category || null,
    location: ui.location || null,
    keterangan: ui.keterangan || null,
    pic: ui.pic || null,
    status_override: ui.statusOverride || null,
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
   * Update status override of a schedule
   */
  updateScheduleStatus: async (
    id: string | number,
    statusOverride: 'upcoming' | 'in_progress' | 'completed'
  ): Promise<Schedule> => {
    const numericId = typeof id === 'number' ? id : parseInt(id, 10);
    const response = await apiClient<any>(`/schedules/${numericId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status_override: statusOverride }),
    });
    const item: BackendSchedule = response?.data ?? response;
    return mapBackendScheduleToUI(item);
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
