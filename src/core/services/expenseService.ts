import { apiClient } from './apiClient';
import {
  FinanceTransaction,
  mapExpenseCategoryToBackend,
  mapExpenseCategoryToUI,
  mapPaymentMethodToBackend,
  mapPaymentMethodToUI,
} from '@/types/finance';

export interface BackendExpense {
  id: number | string;
  vendor: string;
  category: string;
  amount: number | string;
  payment_method: string;
  expense_date: string;
  reference_number?: string;
  notes?: string;
}

export interface BackendExpenseResponse {
  data: BackendExpense[];
}

export { mapExpenseCategoryToBackend, mapPaymentMethodToBackend as mapExpensePaymentMethodToBackend };

export const expenseService = {
  getExpenses: async (): Promise<FinanceTransaction[]> => {
    const response = await apiClient<any>('/expenses');
    
    const payload = response?.data ?? response;
    const expenses: BackendExpense[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return expenses.map((expense: BackendExpense): FinanceTransaction => {
      return {
        id: String(expense.id),
        pilgrimName: expense.vendor,
        type: 'Pengeluaran',
        category: mapExpenseCategoryToUI(expense.category),
        amount: Number(expense.amount),
        paymentMethod: mapPaymentMethodToUI(expense.payment_method),
        date: expense.expense_date,
        status: 'Berhasil',
        notes: expense.notes || undefined,
        referenceNo: expense.reference_number || undefined,
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
    const backendPayload: any = {
      vendor: payload.vendor,
      category: mapExpenseCategoryToBackend(payload.category),
      amount: payload.amount,
      payment_method: mapPaymentMethodToBackend(payload.payment_method),
      expense_date: payload.expense_date,
      notes: payload.notes,
    };
    if (payload.reference_number && payload.reference_number.trim() !== '') {
      backendPayload.reference_number = payload.reference_number;
    }
    const response = await apiClient<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(backendPayload)
    });
    const expense: BackendExpense = response?.data?.expense ?? response?.data ?? response;
    return {
      id: String(expense.id),
      pilgrimName: expense.vendor,
      type: 'Pengeluaran',
      category: mapExpenseCategoryToUI(expense.category),
      amount: Number(expense.amount),
      paymentMethod: mapPaymentMethodToUI(expense.payment_method),
      date: expense.expense_date,
      status: 'Berhasil',
      notes: expense.notes || undefined,
      referenceNo: expense.reference_number || undefined,
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
    const backendPayload: any = {
      vendor: payload.vendor,
      category: mapExpenseCategoryToBackend(payload.category),
      amount: payload.amount,
      payment_method: mapPaymentMethodToBackend(payload.payment_method),
      expense_date: payload.expense_date,
      notes: payload.notes,
    };
    if (payload.reference_number && payload.reference_number.trim() !== '') {
      backendPayload.reference_number = payload.reference_number;
    }
    const response = await apiClient<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload)
    });
    const expense: BackendExpense = response?.data?.expense ?? response?.data ?? response;
    return {
      id: String(expense.id),
      pilgrimName: expense.vendor,
      type: 'Pengeluaran',
      category: mapExpenseCategoryToUI(expense.category),
      amount: Number(expense.amount),
      paymentMethod: mapPaymentMethodToUI(expense.payment_method),
      date: expense.expense_date,
      status: 'Berhasil',
      notes: expense.notes || undefined,
      referenceNo: expense.reference_number || undefined,
    };
  },
  deleteExpense: async (id: string | number): Promise<void> => {
    await apiClient<void>(`/expenses/${id}`, {
      method: 'DELETE'
    });
  },
};
