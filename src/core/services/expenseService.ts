import { apiClient } from './apiClient';
import { FinanceTransaction } from '../store';

export interface BackendExpense {
  id: number | string;
  vendor: string;
  category: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  reference_number?: string;
  notes?: string;
}

export interface BackendExpenseResponse {
  data: BackendExpense[];
}

const mapCategoryToBackend = (uiLabel: string): string => {
  const map: Record<string, string> = {
    "Akomodasi & Tiket": "akomodasi_tiket",
    "Perlengkapan": "perlengkapan",
    "Operasional": "operasional_bus",
    "Transportasi & Bus": "operasional_bus"
  };
  return map[uiLabel] || uiLabel;
};

const mapPaymentMethodToBackend = (uiLabel: string): string => {
  const map: Record<string, string> = {
    "Transfer Bank BCA": "bca_transfer",
    "Transfer Bank Mandiri": "mandiri_transfer",
    "Transfer Bank BSI": "bsi_transfer",
    "Tunai": "cash",
    "EDC / QRIS": "edc_qris"
  };
  return map[uiLabel] || uiLabel;
};

export const mapExpenseCategoryToBackend = (uiCategory: string): string => {
  switch (uiCategory) {
    case 'Akomodasi & Tiket': return 'akomodasi_tiket';
    case 'Perlengkapan': return 'perlengkapan';
    case 'Operasional': return 'operasional_bus';
    case 'Transportasi & Bus': return 'operasional_bus';
    default: return uiCategory;
  }
};

export const mapExpensePaymentMethodToBackend = (uiMethod: string): string => {
  switch (uiMethod) {
    case 'Transfer Bank BCA': return 'bca_transfer';
    case 'Transfer Bank Mandiri': return 'mandiri_transfer';
    case 'Transfer Bank BSI': return 'bsi_transfer';
    case 'Tunai': return 'cash';
    case 'EDC / QRIS': return 'edc_qris';
    case 'QRIS': return 'edc_qris';
    default: return uiMethod;
  }
};

export const expenseService = {
  getExpenses: async (): Promise<FinanceTransaction[]> => {
    const response = await apiClient<BackendExpenseResponse | BackendExpense[]>('/expenses');
    
    // Check if wrapped in data or directly array
    const expenses = Array.isArray((response as BackendExpenseResponse).data) 
      ? (response as BackendExpenseResponse).data 
      : (Array.isArray(response) ? response : []);

    return expenses.map((expense: BackendExpense): FinanceTransaction => {
      return {
        id: String(expense.id),
        pilgrimName: expense.vendor,
        type: 'Pengeluaran',
        category: expense.category,
        amount: Number(expense.amount),
        paymentMethod: expense.payment_method,
        date: expense.expense_date,
        status: 'Berhasil', // Fallback teknis karena FinanceTransaction mewajibkan field status
        notes: expense.notes,
        referenceNo: expense.reference_number,
      };
    });
  },
  createExpense: async (payload: {
    vendor: string;
    category: string;
    amount: number;
    payment_method: string;
    expense_date: string;
    reference_number?: string;
    notes?: string;
  }): Promise<FinanceTransaction> => {
    const backendPayload = {
      ...payload,
      category: mapExpenseCategoryToBackend(payload.category),
      payment_method: mapExpensePaymentMethodToBackend(payload.payment_method)
    };
    const response = await apiClient<BackendExpense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(backendPayload)
    });
    const expense: BackendExpense = (response as any).data ?? response;
    return {
      id: String(expense.id),
      pilgrimName: expense.vendor,
      type: 'Pengeluaran',
      category: expense.category,
      amount: Number(expense.amount),
      paymentMethod: expense.payment_method,
      date: expense.expense_date,
      status: 'Berhasil',
      notes: expense.notes,
      referenceNo: expense.reference_number,
    };
  },
  updateExpense: async (id: string | number, payload: {
    vendor: string;
    category: string;
    amount: number;
    payment_method: string;
    expense_date: string;
    reference_number?: string;
    notes?: string;
  }): Promise<FinanceTransaction> => {
    const backendPayload = {
      ...payload,
      category: mapExpenseCategoryToBackend(payload.category),
      payment_method: mapExpensePaymentMethodToBackend(payload.payment_method)
    };
    const response = await apiClient<BackendExpense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload)
    });
    const expense: BackendExpense = (response as any).data ?? response;
    return {
      id: String(expense.id),
      pilgrimName: expense.vendor,
      type: 'Pengeluaran',
      category: expense.category,
      amount: Number(expense.amount),
      paymentMethod: expense.payment_method,
      date: expense.expense_date,
      status: 'Berhasil',
      notes: expense.notes,
      referenceNo: expense.reference_number,
    };
  },
  deleteExpense: async (id: string | number): Promise<void> => {
    await apiClient<void>(`/expenses/${id}`, {
      method: 'DELETE'
    });
  },
};
