export type BackendPaymentType = 'down_payment' | 'full_payment';

export type BackendPaymentMethod =
  | 'bca_transfer'
  | 'mandiri_transfer'
  | 'bsi_transfer'
  | 'cash'
  | 'edc_qris';

export type BackendOtherIncomeCategory =
  | 'commission'
  | 'equipment_sales'
  | 'administration'
  | 'other';

export type BackendExpenseCategory =
  | 'akomodasi_tiket'
  | 'perlengkapan'
  | 'operasional_bus'
  | 'lainnya';

export interface Payment {
  id: string;
  registration_id: string;
  reference_number?: string | null;
  amount: number | string;
  payment_type: BackendPaymentType;
  payment_method: BackendPaymentMethod;
  payment_date: string;
  notes?: string | null;

  registration?: {
    id?: string;
    registration_number?: string;
    full_name?: string;
    pilgrim_id?: string;
  };

  recorded_by?: {
    id?: string;
    name?: string;
  };
}

export interface CreatePaymentPayload {
  amount: number;
  payment_type: BackendPaymentType;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  payment_type?: BackendPaymentType;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
}

export type FinanceTransactionType =
  | 'Pemasukan (DP)'
  | 'Pemasukan (Pelunasan)'
  | 'Pemasukan (Lunas)'
  | 'Pemasukan Lain'
  | 'Pengeluaran';

export interface FinanceTransaction {
  id: string;
  pilgrimId?: string;
  pilgrimName: string;
  type: FinanceTransactionType;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: 'Berhasil' | 'Pending' | 'Batal';
  notes?: string;
  referenceNo?: string;
}

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  total_receivable: number;
  net_balance: number;
}

/**
 * Payment method mappers
 */
export const mapPaymentMethodToBackend = (method: string): BackendPaymentMethod => {
  const normalized = method.trim().toLowerCase();
  if (normalized.includes('bca')) return 'bca_transfer';
  if (normalized.includes('mandiri')) return 'mandiri_transfer';
  if (normalized.includes('bsi')) return 'bsi_transfer';
  if (normalized.includes('qris') || normalized.includes('edc')) return 'edc_qris';
  if (normalized.includes('tunai') || normalized.includes('cash')) return 'cash';
  return 'cash';
};

export const mapPaymentMethodToUI = (method: string): string => {
  switch (method) {
    case 'bca_transfer':
      return 'Transfer Bank BCA';
    case 'mandiri_transfer':
      return 'Transfer Bank Mandiri';
    case 'bsi_transfer':
      return 'Transfer Bank BSI';
    case 'cash':
      return 'Tunai';
    case 'edc_qris':
      return 'EDC / QRIS';
    default:
      return method;
  }
};

/**
 * Expense category mappers
 */
export const mapExpenseCategoryToBackend = (category: string): BackendExpenseCategory => {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('akomodasi') || normalized.includes('tiket')) return 'akomodasi_tiket';
  if (normalized.includes('perlengkapan')) return 'perlengkapan';
  if (normalized.includes('operasional') || normalized.includes('bus') || normalized.includes('transportasi')) return 'operasional_bus';
  return 'lainnya';
};

export const mapExpenseCategoryToUI = (category: string): string => {
  switch (category) {
    case 'akomodasi_tiket':
      return 'Akomodasi & Tiket';
    case 'perlengkapan':
      return 'Perlengkapan';
    case 'operasional_bus':
      return 'Operasional';
    case 'lainnya':
      return 'Lain-lain';
    default:
      return category;
  }
};

/**
 * Other income category mappers
 */
export const mapOtherIncomeCategoryToBackend = (category: string): BackendOtherIncomeCategory => {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('komisi') || normalized.includes('commission')) return 'commission';
  if (normalized.includes('penjualan') || normalized.includes('equipment')) return 'equipment_sales';
  if (normalized.includes('administrasi') || normalized.includes('admin')) return 'administration';
  return 'other';
};

export const mapOtherIncomeCategoryToUI = (category: string): string => {
  switch (category) {
    case 'commission':
      return 'Komisi';
    case 'equipment_sales':
      return 'Penjualan Perlengkapan';
    case 'administration':
      return 'Administrasi';
    case 'other':
      return 'Lainnya';
    default:
      return category;
  }
};
