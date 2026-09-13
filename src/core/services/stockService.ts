import { apiClient } from './apiClient';

export interface Stock {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string | null;
  notes: string | null;
}

const stockService = {
  async getStocks(): Promise<Stock[]> {
    const response = await apiClient<any>('/stocks', {
      method: 'GET',
    });

    return response.data ?? response;
  },
};

export default stockService;