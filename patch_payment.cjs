const fs = require('fs');

const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPaymentRegex = /\{\/\* Section 4: PEMBAYARAN \*\/\}[\s\S]*?(?=\{\/\* ACTION BUTTONS \*\/\}|<\/div>\s*<\/div>\s*<\/>\s*\)\s*:\s*\()/m;

// Find the content to replace
const match = content.match(oldPaymentRegex);
if (match) {
  let oldPayment = match[0];
  
  const newPayment = `                  {/* Section 4: PEMBAYARAN */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-100 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#00a859] text-white flex items-center justify-center text-sm font-bold shadow-sm">4</div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Informasi & Skema Pembayaran</h3>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Pilih status pembayaran awal pendaftaran</p>
                    </div>

                    {/* Cards Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* DP Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'DP'})}
                        className={\`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 \${
                          formData.paymentOption === 'DP' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                          formData.paymentOption === 'DP' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }\`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={\`font-bold \${formData.paymentOption === 'DP' ? 'text-gray-900' : 'text-gray-700'}\`}>Uang Muka</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Bayar DP awal pendaftaran</p>
                        </div>
                        {formData.paymentOption === 'DP' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>
                      
                      {/* Lunas Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Bayar Lunas'})}
                        className={\`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 \${
                          formData.paymentOption === 'Bayar Lunas' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                          formData.paymentOption === 'Bayar Lunas' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }\`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={\`font-bold \${formData.paymentOption === 'Bayar Lunas' ? 'text-gray-900' : 'text-gray-700'}\`}>Bayar Lunas</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Pembayaran 100% lunas</p>
                        </div>
                        {formData.paymentOption === 'Bayar Lunas' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>

                      {/* Belum Bayar Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Belum Bayar'})}
                        className={\`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 \${
                          formData.paymentOption === 'Belum Bayar' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                          formData.paymentOption === 'Belum Bayar' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }\`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={\`font-bold \${formData.paymentOption === 'Belum Bayar' ? 'text-gray-900' : 'text-gray-700'}\`}>Belum Bayar</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Tanpa tagihan awal</p>
                        </div>
                        {formData.paymentOption === 'Belum Bayar' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>
                    </div>

                    {/* Sub-form when DP or Lunas is selected */}
                    {formData.paymentOption !== 'Belum Bayar' && (
                      <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-sm font-bold uppercase tracking-wide">
                            <CreditCard className="w-4 h-4" />
                            {formData.paymentOption === 'DP' ? 'UANG MUKA' : 'LUNAS'}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">Otomatis mencatat transaksi di Keuangan</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                          {/* Total Biaya Paket */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Total Biaya Paket (Rp) *</label>
                            <Input 
                              type="number" 
                              value={formData.totalAmount || ''} 
                              onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                              placeholder="30000000"
                              className="h-12 rounded-xl text-lg font-bold text-gray-900 border-gray-200 focus:border-[#00a859] focus:ring-[#00a859]"
                            />
                          </div>

                          {/* Nominal Dibayarkan */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">
                              {formData.paymentOption === 'DP' ? 'Nominal DP Dibayarkan (Rp) *' : 'Nominal Lunas (Rp) *'}
                            </label>
                            <Input 
                              type="number" 
                              value={formData.paidAmount !== undefined ? formData.paidAmount : ''} 
                              onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})}
                              placeholder="10000000"
                              className={\`h-12 rounded-xl text-lg font-bold text-gray-900 border-2 focus:ring-[#00a859] \${
                                formData.paidAmount ? 'border-[#00a859] bg-[#f0fdf4]' : 'border-gray-200 focus:border-[#00a859]'
                              }\`}
                            />
                          </div>

                          {/* Metode Pembayaran */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Metode Pembayaran</label>
                            <div className="relative">
                              <select 
                                value={(formData as any).paymentMethod || 'Transfer Bank BCA'}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value} as any)}
                                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859] appearance-none cursor-pointer"
                              >
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank BSI">Transfer Bank BSI</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="Tunai / Cash">Tunai / Cash</option>
                              </select>
                              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Tanggal Pembayaran */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Tanggal Pembayaran</label>
                            <div className="relative">
                              <Input 
                                type="date"
                                value={(formData as any).paymentDate || todayStr}
                                onChange={(e) => setFormData({...formData, paymentDate: e.target.value} as any)}
                                className="h-12 rounded-xl border-gray-200 text-sm font-bold text-gray-900 w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sisa Tagihan Info Box */}
                        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2 text-[#b45309]">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="font-bold text-sm">Sisa Tagihan Pelunasan:</span>
                          </div>
                          <span className="text-lg font-black text-[#92400e]">
                            Rp {Math.max(0, (formData.totalAmount || 0) - (formData.paidAmount || 0)).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Catatan */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Catatan</label>
                          <Input 
                            value={(formData as any).paymentNotes || (formData.paymentOption === 'DP' ? 'Uang Muka Pendaftaran' : 'Pelunasan Pendaftaran')}
                            onChange={(e) => setFormData({...formData, paymentNotes: e.target.value} as any)}
                            className="h-12 rounded-xl border-gray-200 text-sm font-bold text-gray-900"
                            placeholder="Tambahkan catatan pembayaran..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
`;
  
  // Make sure not to replace too much
  const endIndex = content.indexOf('{/* ACTION BUTTONS */}');
  const startIdx = content.indexOf('{/* Section 4: PEMBAYARAN */}', content.indexOf('{!editingPilgrim'));
  
  if (startIdx !== -1 && endIndex !== -1) {
    const toReplace = content.substring(startIdx, endIndex);
    content = content.replace(toReplace, newPayment + '                \n');
  }

  // Ensure imports exist
  const iconsToAdd = ['CreditCard', 'CheckCircle2', 'Clock', 'AlertCircle', 'Check', 'ChevronDown'];
  
  let importStatement = content.match(/import \{([^}]+)\} from 'lucide-react';/);
  if (importStatement) {
    let currentIcons = importStatement[1];
    iconsToAdd.forEach(icon => {
      if (!currentIcons.includes(icon)) {
        currentIcons += `, ${icon}`;
      }
    });
    content = content.replace(importStatement[0], `import {${currentIcons}} from 'lucide-react';`);
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully patched Registration.tsx");
} else {
  console.log("Regex did not match.");
}
