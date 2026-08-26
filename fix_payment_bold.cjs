const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. totalAmount
content = content.replace(
  /className="h-12 rounded-xl text-lg font-bold text-gray-900 border-gray-200 focus:border-\[\#00a859\] focus:ring-\[\#00a859\]"/,
  'className={`h-12 rounded-xl text-lg ${formData.totalAmount ? \'font-bold text-gray-900\' : \'font-medium text-gray-600\'} border-gray-200 focus:border-[#00a859] focus:ring-[#00a859]`}'
);

// 2. paidAmount
content = content.replace(
  /className=\{\`h-12 rounded-xl text-lg font-bold text-gray-900 border-2 focus:ring-\[\#00a859\] \$\{/g,
  'className={`h-12 rounded-xl text-lg ${formData.paidAmount ? \'font-bold text-gray-900\' : \'font-medium text-gray-600\'} border-2 focus:ring-[#00a859] ${'
);

// 3. paymentMethod
content = content.replace(
  /className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 focus:border-\[\#00a859\] focus:ring-1 focus:ring-\[\#00a859\] appearance-none cursor-pointer"/,
  'className={`w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm ${(formData as any).paymentMethod ? \'font-bold text-gray-900\' : \'font-medium text-gray-600\'} focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859] appearance-none cursor-pointer`}'
);

// 4. paymentDate
content = content.replace(
  /className="h-12 rounded-xl border-gray-200 text-sm font-bold text-gray-900 w-full"/,
  'className={`h-12 rounded-xl border-gray-200 text-sm ${(formData as any).paymentDate ? \'font-bold text-gray-900\' : \'font-medium text-gray-600\'} w-full`}'
);

// 5. paymentNotes
content = content.replace(
  /className="h-12 rounded-xl border-gray-200 text-sm font-bold text-gray-900"/,
  'className={`h-12 rounded-xl border-gray-200 text-sm ${(formData as any).paymentNotes ? \'font-bold text-gray-900\' : \'font-medium text-gray-600\'}`}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed payment section boldness.");
