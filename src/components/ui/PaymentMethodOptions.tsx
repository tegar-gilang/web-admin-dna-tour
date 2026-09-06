import React from 'react';

export const PaymentMethodOptions = () => (
  <>
    <option value="" className="text-gray-400 font-normal">Pilih Metode Pembayaran</option>
    <optgroup label="Metode Non-Bank" className="text-gray-900 font-normal">
      <option value="Tunai">Tunai</option>
      <option value="QRIS">QRIS</option>
    </optgroup>
    <optgroup label="Bank Syariah" className="text-gray-900 font-normal">
      <option value="Transfer Bank BSI">Transfer Bank BSI (Bank Syariah Indonesia)</option>
    </optgroup>
    <optgroup label="Bank Nasional & Swasta Utama" className="text-gray-900 font-normal">
      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
    </optgroup>
  </>
);
