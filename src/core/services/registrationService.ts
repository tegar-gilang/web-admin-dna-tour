import { apiClient } from './apiClient';

export interface RegistrationOption {
  registration_id: string;
  full_name: string;
  registration_number: string;
}

export const registrationService = {
  getRegistrations: async (): Promise<RegistrationOption[]> => {
    try {
      const response = await apiClient<any>('/registrations', { method: 'GET' });
      let list: any[] = [];
      if (response.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response)) {
        list = response;
      }

      return list.map((item: any) => ({
        registration_id: item.id ? String(item.id) : (item.registration_id ? String(item.registration_id) : ''),
        full_name: item.full_name || '',
        registration_number: item.registration_number || '',
      }));
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      throw error;
    }
  },
};
