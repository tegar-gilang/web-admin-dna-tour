import { apiClient } from './apiClient';
import {
  FinanceTransaction,
  mapOtherIncomeCategoryToBackend,
  mapOtherIncomeCategoryToUI,
  mapPaymentMethodToBackend,
  mapPaymentMethodToUI,
} from '@/types/finance';

export interface BackendOtherIncome {
  id: string;
  source: string;
  category: string;
  amount: number | string;
  payment_method: string;
  income_date: string;
  reference_number?: string;
  notes?: string;
}

export const otherIncomeService = {
  getOtherIncomes: async (): Promise<FinanceTransaction[]> => {
    const response = await apiClient<any>('/other-incomes');
    const payload = response?.data ?? response;
    const items: BackendOtherIncome[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return items.map((item: BackendOtherIncome): FinanceTransaction => ({
      id: String(item.id),
      pilgrimName: item.source,
      type: 'Pemasukan Lain',
      category: mapOtherIncomeCategoryToUI(item.category),
      amount: Number(item.amount),
      paymentMethod: mapPaymentMethodToUI(item.payment_method),
      date: item.income_date,
      status: 'Berhasil',
      notes: item.notes || undefined,
      referenceNo: item.reference_number || undefined,
    }));
  },

  createOtherIncome: async (payload: {
    source: string;
    category: string;
    amount: number;
    payment_method: string;
    income_date: string;
    notes?: string;
  }): Promise<FinanceTransaction> => {
    const backendPayload = {
      source: payload.source,
      category: mapOtherIncomeCategoryToBackend(payload.category),
      amount: payload.amount,
      payment_method: mapPaymentMethodToBackend(payload.payment_method),
      income_date: payload.income_date,
      notes: payload.notes,
    };

    const response = await apiClient<any>('/other-incomes', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });

    const item: BackendOtherIncome = response?.data?.other_income ?? response?.data ?? response;
    return {
      id: String(item.id),
      pilgrimName: item.source,
      type: 'Pemasukan Lain',
      category: mapOtherIncomeCategoryToUI(item.category),
      amount: Number(item.amount),
      paymentMethod: mapPaymentMethodToUI(item.payment_method),
      date: item.income_date,
      status: 'Berhasil',
      notes: item.notes || undefined,
      referenceNo: item.reference_number || undefined,
    };
  },

  updateOtherIncome: async (
    id: string,
    payload: {
      source: string;
      category: string;
      amount: number;
      payment_method: string;
      income_date: string;
      notes?: string;
    }
  ): Promise<FinanceTransaction> => {
    const backendPayload = {
      source: payload.source,
      category: mapOtherIncomeCategoryToBackend(payload.category),
      amount: payload.amount,
      payment_method: mapPaymentMethodToBackend(payload.payment_method),
      income_date: payload.income_date,
      notes: payload.notes,
    };

    const response = await apiClient<any>(`/other-incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });

    const item: BackendOtherIncome = response?.data?.other_income ?? response?.data ?? response;
    return {
      id: String(item.id),
      pilgrimName: item.source,
      type: 'Pemasukan Lain',
      category: mapOtherIncomeCategoryToUI(item.category),
      amount: Number(item.amount),
      paymentMethod: mapPaymentMethodToUI(item.payment_method),
      date: item.income_date,
      status: 'Berhasil',
      notes: item.notes || undefined,
      referenceNo: item.reference_number || undefined,
    };
  },

  deleteOtherIncome: async (id: string): Promise<void> => {
    await apiClient(`/other-incomes/${id}`, {
      method: 'DELETE',
    });
  },
};
