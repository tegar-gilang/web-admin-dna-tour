import { apiClient } from './apiClient';

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  total_receivable: number;
  net_balance: number;
}

interface BackendFinanceSummary {
  total_pemasukan: number | string;
  total_pengeluaran: number | string;
  total_piutang: number | string;
  saldo_bersih: number | string;
}

export const financeSummaryService = {
  getSummary: async (): Promise<FinanceSummary> => {
    const response = await apiClient<any>('/finance/summary');

    const payload: BackendFinanceSummary =
      response?.data ?? response;

    return {
      total_income: Number(payload.total_pemasukan ?? 0),
      total_expense: Number(payload.total_pengeluaran ?? 0),
      total_receivable: Number(payload.total_piutang ?? 0),
      net_balance: Number(payload.saldo_bersih ?? 0),
    };
  },
};