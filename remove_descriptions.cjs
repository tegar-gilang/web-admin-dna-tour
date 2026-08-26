const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const dpCardOld = `                      {/* DP Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'DP'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 \${
                          formData.paymentOption === 'DP' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                            formData.paymentOption === 'DP' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                          }\`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'DP' ? 'text-gray-900' : 'text-gray-700'}\`}>Uang Muka</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">Bayar DP awal pendaftaran</p>
                        {formData.paymentOption === 'DP' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;

const dpCardNew = `                      {/* DP Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'DP'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 \${
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
                        <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'DP' ? 'text-gray-900' : 'text-gray-700'}\`}>Uang Muka</h4>
                        {formData.paymentOption === 'DP' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;


const lunasCardOld = `                      {/* Lunas Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Bayar Lunas'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 \${
                          formData.paymentOption === 'Bayar Lunas' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                            formData.paymentOption === 'Bayar Lunas' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                          }\`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'Bayar Lunas' ? 'text-gray-900' : 'text-gray-700'}\`}>Bayar Lunas</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">Pembayaran 100% lunas</p>
                        {formData.paymentOption === 'Bayar Lunas' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;

const lunasCardNew = `                      {/* Lunas Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Bayar Lunas'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 \${
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
                        <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'Bayar Lunas' ? 'text-gray-900' : 'text-gray-700'}\`}>Bayar Lunas</h4>
                        {formData.paymentOption === 'Bayar Lunas' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;


const belumCardOld = `                      {/* Belum Bayar Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Belum Bayar'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 \${
                          formData.paymentOption === 'Belum Bayar' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }\`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                            formData.paymentOption === 'Belum Bayar' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                          }\`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'Belum Bayar' ? 'text-gray-900' : 'text-gray-700'}\`}>Belum Bayar</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-snug">Tanpa tagihan awal</p>
                        {formData.paymentOption === 'Belum Bayar' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;

const belumCardNew = `                      {/* Belum Bayar Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Belum Bayar'})}
                        className={\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 \${
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
                        <h4 className={\`text-sm font-bold whitespace-nowrap \${formData.paymentOption === 'Belum Bayar' ? 'text-gray-900' : 'text-gray-700'}\`}>Belum Bayar</h4>
                        {formData.paymentOption === 'Belum Bayar' && <Check className="w-5 h-5 text-[#00a859] absolute top-4 right-4" />}
                      </div>`;


content = content.replace(dpCardOld, dpCardNew);
content = content.replace(lunasCardOld, lunasCardNew);
content = content.replace(belumCardOld, belumCardNew);

// Just in case I need to remove description using a simpler regex if it fails
if (content.includes('Bayar DP awal pendaftaran')) {
  console.log("Replacement might have failed or partially succeeded. Checking...");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Removed descriptions from cards.");
