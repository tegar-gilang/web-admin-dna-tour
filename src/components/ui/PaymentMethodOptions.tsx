import React from 'react';

export const PaymentMethodOptions = () => (
  <>
    <option value="" className="text-gray-400 font-normal">Pilih Metode Pembayaran</option>
    <optgroup label="Metode Non-Bank" className="text-gray-900 font-normal">
      <option value="Tunai">Tunai</option>
      <option value="QRIS">QRIS</option>
      <option value="Virtual Account (VA)">Virtual Account (VA)</option>
      <option value="Giro">Giro</option>
      <option value="Transfer Bank Umum">Transfer Bank (Umum)</option>
    </optgroup>
    <optgroup label="Bank Syariah" className="text-gray-900 font-normal">
      <option value="Transfer Bank BSI">Transfer Bank BSI (Bank Syariah Indonesia)</option>
      <option value="Transfer Bank Muamalat">Transfer Bank Muamalat</option>
      <option value="Transfer BCA Syariah">Transfer BCA Syariah</option>
      <option value="Transfer Bank Mega Syariah">Transfer Bank Mega Syariah</option>
      <option value="Transfer CIMB Niaga Syariah">Transfer CIMB Niaga Syariah</option>
      <option value="Transfer Danamon Syariah">Transfer Danamon Syariah</option>
    </optgroup>
    <optgroup label="Bank Nasional & Swasta Utama" className="text-gray-900 font-normal">
      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
      <option value="Transfer Bank BNI">Transfer Bank BNI</option>
      <option value="Transfer Bank BRI">Transfer Bank BRI</option>
      <option value="Transfer CIMB Niaga">Transfer CIMB Niaga</option>
      <option value="Transfer Bank Permata">Transfer Bank Permata</option>
      <option value="Transfer Bank Danamon">Transfer Bank Danamon</option>
      <option value="Transfer Bank BTN">Transfer Bank BTN</option>
      <option value="Transfer Bank Panin">Transfer Bank Panin</option>
      <option value="Transfer Maybank Indonesia">Transfer Maybank Indonesia</option>
      <option value="Transfer OCBC NISP">Transfer OCBC NISP</option>
      <option value="Transfer Bank Mega">Transfer Bank Mega</option>
      <option value="Transfer Bank Sinarmas">Transfer Bank Sinarmas</option>
    </optgroup>
    <optgroup label="Bank Pembangunan Daerah (BPD) & Lainnya" className="text-gray-900 font-normal">
      <option value="Transfer Bank DKI">Transfer Bank DKI</option>
      <option value="Transfer Bank BJB">Transfer Bank BJB</option>
      <option value="Transfer Bank Jateng">Transfer Bank Jateng</option>
      <option value="Transfer Bank Jatim">Transfer Bank Jatim</option>
      <option value="Transfer Bank BPD DIY">Transfer Bank BPD DIY</option>
      <option value="Transfer Bank BPD Bali">Transfer Bank BPD Bali</option>
      <option value="Transfer Bank Sumut">Transfer Bank Sumut</option>
      <option value="Transfer Bank Sumsel Babel">Transfer Bank Sumsel Babel</option>
      <option value="Transfer Bank Kalbar">Transfer Bank Kalbar</option>
      <option value="Transfer Bank Kaltimtara">Transfer Bank Kaltimtara</option>
      <option value="Transfer Bank Sulselbar">Transfer Bank Sulselbar</option>
      <option value="Transfer Bank Papua">Transfer Bank Papua</option>
      <option value="Transfer Bank Aceh Syariah">Transfer Bank Aceh Syariah</option>
      <option value="Transfer Bank Nagari">Transfer Bank Nagari</option>
      <option value="Transfer Bank Riau Kepri Syariah">Transfer Bank Riau Kepri Syariah</option>
    </optgroup>
  </>
);
