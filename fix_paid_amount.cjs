const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /value=\{formData\.paidAmount !== undefined \? formData\.paidAmount : ''\}/g,
  "value={formData.paidAmount || ''}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed paidAmount input to show empty when 0.");
