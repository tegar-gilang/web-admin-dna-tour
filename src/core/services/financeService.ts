import { apiClient } from './apiClient';
import { FinanceTransaction } from '../store';

// Interface based on backend contract
export interface BackendPayment {
  id: number | string;
  registration_id: number | string;
  amount: number;
  payment_type: 'down_payment' | 'full_payment' | string;
  payment_method: string;
  payment_date: string;
  notes?: string;
  status?: string;
  registration?: {
    full_name?: string;
    registration_number?: string;
  };
}

export interface BackendPaymentResponse {
  data: BackendPayment[];
}

export const financeService = {
  getPayments: async (): Promise<FinanceTransaction[]> => {
    // 1. Fetch data from backend
    const response = await apiClient<BackendPaymentResponse>('/payments');
    
    // Check if the backend returns data array directly or wrapped in data property
    const payments = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);

    // 2. Map data to existing FinanceTransaction structure
    return payments.map((payment: BackendPayment): FinanceTransaction => {
      let typeStr: FinanceTransaction['type'] = 'Pemasukan Lain';
      if (payment.payment_type === 'down_payment') {
        typeStr = 'Pemasukan (DP)';
      } else if (payment.payment_type === 'full_payment') {
        typeStr = 'Pemasukan (Pelunasan)';
      }

      let statusStr: FinanceTransaction['status'] = 'Berhasil';
      if (payment.status) {
         if (payment.status.toLowerCase() === 'pending') statusStr = 'Pending';
         else if (payment.status.toLowerCase() === 'cancelled' || payment.status.toLowerCase() === 'batal' || payment.status.toLowerCase() === 'failed') statusStr = 'Batal';
      }

      return {
        id: String(payment.id),
        pilgrimId: String(payment.registration_id),
        pilgrimName: payment.registration?.full_name || 'Tanpa Nama',
        type: typeStr,
        category: 'Pembayaran Jamaah', // Fallback as it's not provided by backend payments
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method || '-',
        date: payment.payment_date,
        status: statusStr,
        notes: payment.notes || '',
      };
    });
  },
  createPayment: async (registrationId: string | number, payload: { amount: number; payment_type: 'down_payment' | 'full_payment' | string; payment_method: string; payment_date: string; notes?: string; }): Promise<FinanceTransaction> => {
    const response = await apiClient.post<BackendPayment>(`/registrations/${registrationId}/payments`, payload);
    const payment: BackendPayment = (response as any).data ?? response;
    let typeStr: FinanceTransaction['type'] = 'Pemasukan Lain';
    if (payment.payment_type === 'down_payment') {
      typeStr = 'Pemasukan (DP)';
    } else if (payment.payment_type === 'full_payment') {
      typeStr = 'Pemasukan (Pelunasan)';
    }
    const statusStr: FinanceTransaction['status'] = payment.status ? (payment.status.toLowerCase() === 'pending' ? 'Pending' : (payment.status.toLowerCase() === 'cancelled' || payment.status.toLowerCase() === 'batal' || payment.status.toLowerCase() === 'failed' ? 'Batal' : 'Berhasil')) : 'Berhasil';
    return {
      id: String(payment.id),
      pilgrimId: String(payment.registration_id),
      pilgrimName: payment.registration?.full_name || 'Tanpa Nama',
      type: typeStr,
      category: 'Pembayaran Jamaah',
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method || '-',
      date: payment.payment_date,
      status: statusStr,
      notes: payment.notes || '',
    };
  },
};

