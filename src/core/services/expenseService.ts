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
    const response = await apiClient.post<BackendExpense>('/expenses', payload);
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
    const response = await apiClient.put<BackendExpense>(`/expenses/${id}`, payload);
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
};
