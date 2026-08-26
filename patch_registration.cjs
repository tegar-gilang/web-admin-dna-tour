const fs = require('fs');

const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldModalHeader = `            <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2.5">
                {editingPilgrim ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalMode('detail')}
                      className={\`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none \${
                        modalMode === 'detail'
                          ? 'bg-[#00a859] text-white shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }\`}
                    >
                      Data Diri Jamaah
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode('edit')}
                      className={\`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none \${
                        modalMode === 'edit'
                          ? 'bg-[#00a859] text-white shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }\`}
                    >
                      Form Edit
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                  >
                    Tambah Jamaah
                  </button>
                )}
              </div>`;

const newModalHeader = `            <div className="flex justify-between items-start sm:items-center pb-5 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2.5">
                {editingPilgrim ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalMode('detail')}
                      className={\`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none \${
                        modalMode === 'detail'
                          ? 'bg-[#00a859] text-white shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }\`}
                    >
                      Data Diri Jamaah
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode('edit')}
                      className={\`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none \${
                        modalMode === 'edit'
                          ? 'bg-[#00a859] text-white shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }\`}
                    >
                      Form Edit
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center border border-[#bbf7d0] shrink-0">
                      <UserPlus className="w-6 h-6 text-[#00a859]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Pendaftaran Jamaah Baru</h2>
                      <p className="text-sm text-gray-500 font-medium">Isi formulir pendaftaran jamaah baru</p>
                    </div>
                  </div>
                )}
              </div>`;

content = content.replace(oldModalHeader, newModalHeader);


const startMarker = `          {/* TAB 2: FORM EDIT (Exact Match to Pilgrims Form Edit) */}
          {modalMode === 'edit' && (
            <div className="space-y-6">`;

const oldSectionsRegex = /\{\/\* Section 1: INFORMASI DIRI JAMAAH \*\/\}[\s\S]*?\{\/\* ACTION BUTTONS \*\/\}/m;

// Find the content to replace
const match = content.match(oldSectionsRegex);
if (match) {
  const oldSections = match[0];
  
  const newSections = `{!editingPilgrim ? (
                <>
                  {/* Section 1: INFORMASI DIRI JAMAAH */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">1</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">INFORMASI DIRI JAMAAH</h3>
                    </div>
                    <div className="space-y-4">
                      {/* NAMA LENGKAP */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NAMA LENGKAP *</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Cth. Ahmad Hidayat" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* NO. PASPOR */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. PASPOR</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.passport || ''} onChange={(e) => setFormData({...formData, passport: e.target.value})} placeholder="Cth. A1234567" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 uppercase focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* NO. KTP */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. KTP</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.ktp || ''} onChange={(e) => setFormData({...formData, ktp: e.target.value})} placeholder="16 Digit NIK KTP" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* NO. TELEPON */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. TELEPON</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Cth. +62 812..." className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* USIA */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">USIA</label>
                        <div className="sm:col-span-8">
                          <Input type="number" value={formData.age !== undefined && formData.age !== 0 ? formData.age : ''} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} placeholder="45" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* JENIS KELAMIN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">JENIS KELAMIN</label>
                        <div className="sm:col-span-8">
                          <select value={formData.gender || 'Laki-laki'} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: ADMINISTRASI */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">2</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">ADMINISTRASI</h3>
                    </div>
                    <div className="space-y-4">
                      {/* TANGGAL PENDAFTARAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">TANGGAL PENDAFTARAN</label>
                        <div className="sm:col-span-8">
                          <Input type="date" value={formData.registrationDate || todayStr} onChange={(e) => setFormData({...formData, registrationDate: e.target.value})} className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* TANGGAL KEBERANGKATAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">TANGGAL KEBERANGKATAN</label>
                        <div className="sm:col-span-8">
                          <Input type="date" value={formData.departureDate || ''} onChange={(e) => setFormData({...formData, departureDate: e.target.value})} className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* PILIHAN PAKET UMRAH */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">PILIHAN PAKET UMRAH</label>
                        <div className="sm:col-span-8">
                          <select value={formData.umrahPackage || 'Reguler 9 Hari'} onChange={(e) => setFormData({...formData, umrahPackage: e.target.value})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Reguler 9 Hari">Reguler 9 Hari</option>
                            <option value="Reguler 12 Hari">Reguler 12 Hari</option>
                            <option value="VIP 9 Hari">VIP 9 Hari</option>
                            <option value="Yamani">Yamani</option>
                            <option value="Raudhah">Raudhah</option>
                            <option value="Multazam">Multazam</option>
                          </select>
                        </div>
                      </div>
                      {/* KLOTER KEBERANGKATAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">KLOTER KEBERANGKATAN</label>
                        <div className="sm:col-span-8">
                          <select value={formData.group || ''} onChange={(e) => setFormData({...formData, group: e.target.value})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="">-- Pilih Kloter / Group --</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* VAKSIN MENINGITIS */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">VAKSIN MENINGITIS</label>
                        <div className="sm:col-span-8">
                          <select value={formData.meningitis ? 'Sudah Vaksin' : 'Belum Vaksin'} onChange={(e) => setFormData({...formData, meningitis: e.target.value === 'Sudah Vaksin'})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Belum Vaksin">Belum Vaksin</option>
                            <option value="Sudah Vaksin">Sudah Vaksin</option>
                          </select>
                        </div>
                      </div>
                      {/* PAS FOTO 4X6 */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">PAS FOTO 4X6</label>
                        <div className="sm:col-span-8">
                          <select value={formData.photo ? 'Sudah Ada' : 'Belum Ada'} onChange={(e) => setFormData({...formData, photo: e.target.value === 'Sudah Ada'})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Belum Ada">Belum Ada</option>
                            <option value="Sudah Ada">Sudah Ada</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: PERLENGKAPAN */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">3</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">PERLENGKAPAN</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'koperBesar', label: 'Koper Besar' },
                        { id: 'koperKabin', label: 'Koper Kabin' },
                        { id: 'batik', label: 'Seragam Batik' },
                        { id: 'bukuDomisili', label: 'Buku Panduan' },
                        { id: 'kainIhram', label: 'Kain Ihram' },
                        { id: 'kerudungMerah', label: 'Kerudung Merah' },
                        { id: 'kerudungPutih', label: 'Kerudung Putih' },
                        { id: 'tasSelempang', label: 'Tas Selempang' },
                        { id: 'tasSandal', label: 'Tas Sandal' },
                        { id: 'syall', label: 'Syall' },
                        { id: 'sabuk', label: 'Sabuk' },
                      ].map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white shadow-2xs cursor-pointer hover:border-[#00a859] transition-colors" onClick={() => {
                          const currentVal = !!formData[item.id as keyof Pilgrim];
                          setFormData({ ...formData, [item.id]: !currentVal });
                        }}>
                          <Checkbox checked={!!formData[item.id as keyof Pilgrim]} onCheckedChange={(val) => setFormData({ ...formData, [item.id]: val })} />
                          <span className="font-bold text-gray-900">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: PEMBAYARAN */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">4</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">PEMBAYARAN</h3>
                    </div>
                    <div className="space-y-4">
                      {/* STATUS PEMBAYARAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">STATUS PEMBAYARAN</label>
                        <div className="sm:col-span-8">
                          <select value={formData.paymentOption || 'Belum Bayar'} onChange={(e) => setFormData({...formData, paymentOption: e.target.value as any})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Belum Bayar">Belum Bayar</option>
                            <option value="DP">DP (Uang Muka)</option>
                            <option value="Bayar Lunas">Bayar Lunas</option>
                          </select>
                        </div>
                      </div>
                      {/* TOTAL BIAYA PAKET (RP) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">TOTAL BIAYA PAKET (RP)</label>
                        <div className="sm:col-span-8">
                          <Input type="number" value={formData.totalAmount || ''} onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})} placeholder="30000000" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 px-4 sm:px-5 font-mono focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                      {/* NOMINAL TELAH DIBAYAR (RP) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NOMINAL TELAH DIBAYAR (RP)</label>
                        <div className="sm:col-span-8">
                          <Input type="number" value={formData.paidAmount !== undefined && formData.paidAmount !== null ? formData.paidAmount : ''} onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})} placeholder="10000000" className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 px-4 sm:px-5 font-mono focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
${oldSections.split('\n').map(line => '                  ' + line.trimStart()).join('\n')}
                </>
              )}
              {/* ACTION BUTTONS */}`;
  
  content = content.replace(oldSections, newSections);
}

// Add import UserPlus
if (!content.includes('UserPlus')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import {$1, UserPlus} from 'lucide-react';");
}

fs.writeFileSync(path, content, 'utf8');
