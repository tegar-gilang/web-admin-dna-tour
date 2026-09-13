import { apiClient } from './apiClient';
import {
  Payment,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  FinanceTransaction,
  mapPaymentMethodToUI,
  mapPaymentMethodToBackend,
} from '@/types/finance';

export type { Payment, CreatePaymentPayload, UpdatePaymentPayload, FinanceTransaction };

const mapPaymentType = (
  paymentType: 'down_payment' | 'full_payment'
): FinanceTransaction['type'] => {
  switch (paymentType) {
    case 'down_payment':
      return 'Pemasukan (DP)';
    case 'full_payment':
      return 'Pemasukan (Pelunasan)';
    default:
      return 'Pemasukan (DP)';
  }
};

const mapPaymentCategory = (
  paymentType: 'down_payment' | 'full_payment'
): string => {
  switch (paymentType) {
    case 'down_payment':
      return 'Pendaftaran Umrah';
    case 'full_payment':
      return 'Pelunasan Umrah';
    default:
      return 'Pembayaran Umrah';
  }
};

export const mapPaymentToTransaction = (
  payment: Payment
): FinanceTransaction => {
  const registration = payment.registration;

  const pilgrimName =
    registration?.full_name ||
    payment.registration_id;

  const amount = Number(payment.amount);

  return {
    id: payment.id,
    pilgrimId:
      payment.registration?.pilgrim_id ??
      payment.registration_id,
    pilgrimName,
    type: mapPaymentType(payment.payment_type),
    category: mapPaymentCategory(payment.payment_type),
    amount,
    paymentMethod: mapPaymentMethodToUI(payment.payment_method),
    date: payment.payment_date,
    status: 'Berhasil',
    notes: payment.notes ?? undefined,
    referenceNo: payment.reference_number ?? undefined,
  };
};

export const financeService = {
  getPayments: async (): Promise<FinanceTransaction[]> => {
    const response = await apiClient<any>('/payments');

    const payload = response?.data ?? response;

    const payments: Payment[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return payments.map(mapPaymentToTransaction);
  },

  getRegistrationPayments: async (
    registrationId: string
  ): Promise<FinanceTransaction[]> => {
    const response = await apiClient<any>(
      `/registrations/${registrationId}/payments`
    );

    const payload = response?.data ?? response;

    const payments: Payment[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return payments.map(mapPaymentToTransaction);
  },

  createPayment: async (
    registrationId: string,
    payload: CreatePaymentPayload
  ): Promise<FinanceTransaction> => {
    const backendPayload = {
      ...payload,
      payment_method: mapPaymentMethodToBackend(payload.payment_method),
    };
    const response = await apiClient<any>(
      `/registrations/${registrationId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(backendPayload),
      }
    );

    const payment: Payment =
      response?.data?.payment ??
      response?.data ??
      response;

    return mapPaymentToTransaction(payment);
  },

  updatePayment: async (
    paymentId: string,
    payload: UpdatePaymentPayload
  ): Promise<FinanceTransaction> => {
    const backendPayload = {
      ...payload,
      payment_method: payload.payment_method ? mapPaymentMethodToBackend(payload.payment_method) : undefined,
    };
    const response = await apiClient<any>(
      `/payments/${paymentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(backendPayload),
      }
    );

    const payment: Payment =
      response?.data?.payment ??
      response?.data ??
      response;

    return mapPaymentToTransaction(payment);
  },

  deletePayment: async (
    paymentId: string
  ): Promise<void> => {
    await apiClient(
      `/payments/${paymentId}`,
      {
        method: 'DELETE',
      }
    );
  },
};