import { apiClient } from './apiClient';

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  total_receivable: number;
  net_balance: number;
}

export const financeSummaryService = {
  /**
   * Retrieve finance summary from backend.
   * Returns a plain {@link FinanceSummary} object.
   */
  getSummary: async (): Promise<FinanceSummary> => {
    const response = await apiClient<FinanceSummary>('/finance/summary');
    // Some APIs wrap the payload in a `{ data: ... }` field.
    const payload = (response as any).data ?? response;
    return payload as FinanceSummary;
  },
};
