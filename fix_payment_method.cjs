const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPaymentMethod = `<select 
                                value={(formData as any).paymentMethod || 'Transfer Bank BCA'}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value} as any)}
                                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859] appearance-none cursor-pointer"
                              >
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank BSI">Transfer Bank BSI</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="Tunai / Cash">Tunai / Cash</option>`;

const newPaymentMethod = `<select 
                                value={(formData as any).paymentMethod || ''}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value} as any)}
                                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859] appearance-none cursor-pointer"
                              >
                                <option value="">Pilih Metode Pembayaran</option>
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank BSI">Transfer Bank BSI</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="Tunai / Cash">Tunai / Cash</option>`;

content = content.replace(oldPaymentMethod, newPaymentMethod);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed payment method to be empty.");
