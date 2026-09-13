import React from 'react';
import { BackendPaymentMethod } from '@/types/finance';

interface PaymentMethodOptionsProps {
  includePlaceholder?: boolean;
}

export const PaymentMethodOptions: React.FC<PaymentMethodOptionsProps> = ({ includePlaceholder = true }) => (
  <>
    {includePlaceholder && <option value="" className="text-gray-400 font-normal">Pilih Metode Pembayaran</option>}
    <optgroup label="Metode Non-Bank" className="text-gray-900 font-normal">
      <option value="cash">Tunai</option>
      <option value="edc_qris">EDC / QRIS</option>
    </optgroup>
    <optgroup label="Bank Syariah" className="text-gray-900 font-normal">
      <option value="bsi_transfer">Transfer Bank BSI (Bank Syariah Indonesia)</option>
    </optgroup>
    <optgroup label="Bank Nasional & Swasta Utama" className="text-gray-900 font-normal">
      <option value="bca_transfer">Transfer Bank BCA</option>
      <option value="mandiri_transfer">Transfer Bank Mandiri</option>
    </optgroup>
  </>
);

