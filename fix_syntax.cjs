const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the backslashes
content = content.replace(/\\'DP\\'/g, "'DP'");
content = content.replace(/\\'text-gray-900\\'/g, "'text-gray-900'");
content = content.replace(/\\'text-gray-700\\'/g, "'text-gray-700'");
content = content.replace(/\\'Bayar Lunas\\'/g, "'Bayar Lunas'");
content = content.replace(/\\'Belum Bayar\\'/g, "'Belum Bayar'");

fs.writeFileSync(path, content, 'utf8');
