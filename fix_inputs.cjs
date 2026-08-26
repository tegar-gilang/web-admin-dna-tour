const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Gender
const genderOld = `<select value={formData.gender || 'Laki-laki'} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>`;
const genderNew = `<select value={formData.gender || ''} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>`;

content = content.replace(genderOld, genderNew);

// Fix Umrah Package
const umrahOld = `<select value={formData.umrahPackage || 'Reguler 9 Hari'} onChange={(e) => setFormData({...formData, umrahPackage: e.target.value})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="Reguler 9 Hari">Reguler 9 Hari</option>
                            <option value="Reguler 12 Hari">Reguler 12 Hari</option>
                            <option value="VIP 9 Hari">VIP 9 Hari</option>
                            <option value="Yamani">Yamani</option>
                            <option value="Raudhah">Raudhah</option>
                            <option value="Multazam">Multazam</option>
                          </select>`;
const umrahNew = `<select value={formData.umrahPackage || ''} onChange={(e) => setFormData({...formData, umrahPackage: e.target.value})} className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer">
                            <option value="">Pilih Paket Umrah</option>
                            <option value="Reguler 9 Hari">Reguler 9 Hari</option>
                            <option value="Reguler 12 Hari">Reguler 12 Hari</option>
                            <option value="VIP 9 Hari">VIP 9 Hari</option>
                            <option value="Yamani">Yamani</option>
                            <option value="Raudhah">Raudhah</option>
                            <option value="Multazam">Multazam</option>
                          </select>`;

content = content.replace(umrahOld, umrahNew);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed gender and umrah package inputs.");
