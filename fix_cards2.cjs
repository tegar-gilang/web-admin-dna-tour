const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<h4 className=\{\`font-bold \$\{formData\.paymentOption === 'DP' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Uang Muka<\/h4>/g, 
  '<h4 className={`font-bold whitespace-nowrap ${formData.paymentOption === \\\'DP\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Uang Muka</h4>');

content = content.replace(/<h4 className=\{\`font-bold \$\{formData\.paymentOption === 'Bayar Lunas' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Bayar Lunas<\/h4>/g, 
  '<h4 className={`font-bold whitespace-nowrap ${formData.paymentOption === \\\'Bayar Lunas\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Bayar Lunas</h4>');

content = content.replace(/<h4 className=\{\`font-bold \$\{formData\.paymentOption === 'Belum Bayar' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Belum Bayar<\/h4>/g, 
  '<h4 className={`font-bold whitespace-nowrap ${formData.paymentOption === \\\'Belum Bayar\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Belum Bayar</h4>');

content = content.replace(/className=\{\`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 \$\{/g, 
  'className={`relative p-4 pr-10 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${');

fs.writeFileSync(path, content, 'utf8');
