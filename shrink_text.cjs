const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Uang Muka Title
content = content.replace(
  /<h4 className=\{\`font-bold whitespace-nowrap \$\{formData\.paymentOption === 'DP' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Uang Muka<\/h4>/g,
  '<h4 className={`text-sm font-bold whitespace-nowrap ${formData.paymentOption === \\\'DP\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Uang Muka</h4>'
);
// Replace Uang Muka description
content = content.replace(
  /<p className="text-sm text-gray-500">Bayar DP awal pendaftaran<\/p>/g,
  '<p className="text-xs text-gray-500 leading-snug">Bayar DP awal pendaftaran</p>'
);


// Replace Bayar Lunas Title
content = content.replace(
  /<h4 className=\{\`font-bold whitespace-nowrap \$\{formData\.paymentOption === 'Bayar Lunas' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Bayar Lunas<\/h4>/g,
  '<h4 className={`text-sm font-bold whitespace-nowrap ${formData.paymentOption === \\\'Bayar Lunas\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Bayar Lunas</h4>'
);
// Replace Bayar Lunas description
content = content.replace(
  /<p className="text-sm text-gray-500">Pembayaran 100% lunas<\/p>/g,
  '<p className="text-xs text-gray-500 leading-snug">Pembayaran 100% lunas</p>'
);


// Replace Belum Bayar Title
content = content.replace(
  /<h4 className=\{\`font-bold whitespace-nowrap \$\{formData\.paymentOption === 'Belum Bayar' \? 'text-gray-900' : 'text-gray-700'\}\`\}>Belum Bayar<\/h4>/g,
  '<h4 className={`text-sm font-bold whitespace-nowrap ${formData.paymentOption === \\\'Belum Bayar\\\' ? \\\'text-gray-900\\\' : \\\'text-gray-700\\\'}`}>Belum Bayar</h4>'
);
// Replace Belum Bayar description
content = content.replace(
  /<p className="text-sm text-gray-500">Tanpa tagihan awal<\/p>/g,
  '<p className="text-xs text-gray-500 leading-snug">Tanpa tagihan awal</p>'
);

// Reduce gap slightly in the flex container for icon and title
content = content.replace(
  /className="flex items-center gap-3"/g,
  'className="flex items-center gap-2"'
);

// We should also adjust padding right (pr-10) to something slightly smaller or keep it. Let's make it pr-8 so the checkmark still fits but gives more space.
content = content.replace(
  /className=\{\`relative p-4 pr-10 rounded-2xl border-2/g,
  'className={`relative p-3 sm:p-4 sm:pr-8 rounded-2xl border-2'
);

// Also change the gap in the flex-col wrapper from gap-3 to gap-2
content = content.replace(
  /cursor-pointer transition-all flex flex-col gap-3 \$\{/g,
  'cursor-pointer transition-all flex flex-col gap-2 ${'
);


fs.writeFileSync(path, content, 'utf8');
console.log("Reduced text size and adjusted padding/gaps.");
