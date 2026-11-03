import { apiClient } from './apiClient';

export interface BackendStock {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  location: string | null;
  updated_at: string;
  notes: string | null;
  has_sizes?: boolean;
}

export interface Stock {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string | null;
  lastUpdated: string;
  notes: string | null;
  hasSizes?: boolean;
}

export interface StockTransaction {
  id: string;
  stockId: string;
  type: string;
  quantity: number;
  size: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface BackendStockTransaction {
  id: string;
  stock_id: string;
  type: string;
  quantity: number;
  size: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export const mapBackendStockToFrontend = (data: BackendStock): Stock => {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    category: data.category,
    quantity: data.quantity,
    minStock: data.min_stock,
    unit: data.unit,
    location: data.location,
    lastUpdated: data.updated_at,
    notes: data.notes,
    hasSizes: data.has_sizes || false,
  };
};

export const mapBackendTransactionToFrontend = (data: BackendStockTransaction): StockTransaction => {
  return {
    id: data.id,
    stockId: data.stock_id,
    type: data.type,
    quantity: data.quantity,
    size: data.size,
    referenceType: data.reference_type,
    referenceId: data.reference_id,
    createdAt: data.created_at,
  };
};

const stockService = {
  async getStocks(): Promise<Stock[]> {
    const response = await apiClient<{ data: BackendStock[] }>('/stocks', {
      method: 'GET',
    });
    return (response.data || []).map(mapBackendStockToFrontend);
  },

  async getStockById(id: string): Promise<Stock> {
    const response = await apiClient<{ data: BackendStock }>(`/stocks/${id}`, {
      method: 'GET',
    });
    return mapBackendStockToFrontend(response.data);
  },

  async createStock(payload: any): Promise<Stock> {
    const response = await apiClient<{ data: BackendStock }>('/stocks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendStockToFrontend(response.data);
  },

  async updateStock(id: string, payload: any): Promise<Stock> {
    const response = await apiClient<{ data: BackendStock }>(`/stocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBackendStockToFrontend(response.data);
  },

  async deleteStock(id: string): Promise<{ message: string }> {
    const response = await apiClient<{ message: string }>(`/stocks/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  async adjustStock(id: string, quantity: number): Promise<Stock> {
    const response = await apiClient<{ data: BackendStock }>(`/stocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return mapBackendStockToFrontend(response.data);
  },

  async getStockTransactions(id: string): Promise<StockTransaction[]> {
    const response = await apiClient<{ data: BackendStockTransaction[] }>(`/stocks/${id}/transactions`, {
      method: 'GET',
    });
    return (response.data || []).map(mapBackendTransactionToFrontend);
  }
};

export default stockService;