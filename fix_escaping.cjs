const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\\'DP\\'/g, "'DP'");
content = content.replace(/\\'font-bold text-gray-900\\'/g, "'font-bold text-gray-900'");
content = content.replace(/\\'font-medium text-gray-700\\'/g, "'font-medium text-gray-700'");
content = content.replace(/\\'Bayar Lunas\\'/g, "'Bayar Lunas'");
content = content.replace(/\\'Belum Bayar\\'/g, "'Belum Bayar'");

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed escaped quotes.");
