const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update DP card
content = content.replace(
  /<h4 className=\{\`text-sm font-bold whitespace-nowrap \$\{formData\.paymentOption === 'DP' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Uang Muka<\/h4>\n\s*\{formData\.paymentOption === 'DP' && <Check className="w-5 h-5 text-\[\#00a859\] absolute top-4 right-4" \/>\}/g,
  '<h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === \\\'DP\\\' ? \\\'font-bold text-gray-900\\\' : \\\'font-medium text-gray-700\\\'}`}>Uang Muka</h4>'
);

// Update Bayar Lunas card
content = content.replace(
  /<h4 className=\{\`text-sm font-bold whitespace-nowrap \$\{formData\.paymentOption === 'Bayar Lunas' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Bayar Lunas<\/h4>\n\s*\{formData\.paymentOption === 'Bayar Lunas' && <Check className="w-5 h-5 text-\[\#00a859\] absolute top-4 right-4" \/>\}/g,
  '<h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === \\\'Bayar Lunas\\\' ? \\\'font-bold text-gray-900\\\' : \\\'font-medium text-gray-700\\\'}`}>Bayar Lunas</h4>'
);

// Update Belum Bayar card
content = content.replace(
  /<h4 className=\{\`text-sm font-bold whitespace-nowrap \$\{formData\.paymentOption === 'Belum Bayar' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Belum Bayar<\/h4>\n\s*\{formData\.paymentOption === 'Belum Bayar' && <Check className="w-5 h-5 text-\[\#00a859\] absolute top-4 right-4" \/>\}/g,
  '<h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === \\\'Belum Bayar\\\' ? \\\'font-bold text-gray-900\\\' : \\\'font-medium text-gray-700\\\'}`}>Belum Bayar</h4>'
);

// Remove the sm:pr-8 since there's no absolute icon anymore
content = content.replace(/className=\{\`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2/g, 'className={`relative p-3 sm:p-4 rounded-2xl border-2');

fs.writeFileSync(path, content, 'utf8');
console.log("Updated bold state and removed checklist.");
