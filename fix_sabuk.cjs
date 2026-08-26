const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove sabuk from checkboxes
content = content.replace(
  /\{ id: 'sabuk', label: 'Sabuk' \},?\n/g,
  ''
);

// Add select for Sabuk right below the grid
const gridClosingTag = '                    </div>';
const sabukSelector = `                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Ukuran Sabuk</label>
                      <select 
                        value={formData.sabuk} 
                        onChange={(e) => setFormData({...formData, sabuk: e.target.value})} 
                        className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="">Pilih Ukuran Sabuk</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>`;

// Wait, we need to be careful with replacing `</div>`. We'll use a more specific regex around the end of Perlengkapan block.
const perlengkapanBlockEnd = `                        </div>
                      ))}
                    </div>`;

const newPerlengkapanBlockEnd = `                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 border border-gray-200 rounded-2xl bg-gray-50">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Ukuran Sabuk</label>
                      <select 
                        value={formData.sabuk || ''} 
                        onChange={(e) => setFormData({...formData, sabuk: e.target.value})} 
                        className="h-12 w-full sm:w-1/2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="">Pilih Ukuran Sabuk</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>`;

content = content.replace(perlengkapanBlockEnd, newPerlengkapanBlockEnd);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated Sabuk UI.");
