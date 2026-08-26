const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

function replaceClass(fieldRegex, condition) {
  content = content.replace(fieldRegex, (match, beforeClass, classContent, afterClass) => {
    // Check if it's already converted to template literal
    if (beforeClass.includes('className={`')) return match;
    
    // It should be something like `className="... font-bold text-gray-900 ..."`
    let newClassContent = classContent.replace('font-bold text-gray-900', `\${${condition} ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`);
    return `${beforeClass}className={\`${newClassContent}\`}${afterClass}`;
  });
}

// 1. name
replaceClass(
  /(<Input value=\{formData\.name \|\| ''\}.*?)className="([^"]+)"( \/>)/,
  "formData.name"
);
// 2. passport
replaceClass(
  /(<Input value=\{formData\.passport \|\| ''\}.*?)className="([^"]+)"( \/>)/,
  "formData.passport"
);
// 3. ktp
replaceClass(
  /(<Input value=\{formData\.ktp \|\| ''\}.*?)className="([^"]+)"( \/>)/,
  "formData.ktp"
);
// 4. phone
replaceClass(
  /(<Input value=\{formData\.phone \|\| ''\}.*?)className="([^"]+)"( \/>)/,
  "formData.phone"
);
// 5. age
replaceClass(
  /(<Input type="number" value=\{formData\.age [^\}]+\}.*?)className="([^"]+)"( \/>)/,
  "formData.age"
);
// 6. gender
replaceClass(
  /(<select value=\{formData\.gender \|\| ''\}.*?)className="([^"]+)"(>)/,
  "formData.gender"
);
// 7. registrationDate
replaceClass(
  /(<Input type="date" value=\{formData\.registrationDate [^\}]+\}.*?)className="([^"]+)"( \/>)/,
  "formData.registrationDate"
);
// 8. departureDate
replaceClass(
  /(<Input type="date" value=\{formData\.departureDate \|\| ''\}.*?)className="([^"]+)"( \/>)/,
  "formData.departureDate"
);
// 9. umrahPackage
replaceClass(
  /(<select value=\{formData\.umrahPackage \|\| ''\}.*?)className="([^"]+)"(>)/,
  "formData.umrahPackage"
);
// 10. group
replaceClass(
  /(<select value=\{formData\.group \|\| ''\}.*?)className="([^"]+)"(>)/,
  "formData.group"
);
// 11. meningitis
replaceClass(
  /(<select value=\{formData\.meningitis \? 'Sudah Vaksin' : 'Belum Vaksin'\}.*?)className="([^"]+)"(>)/,
  "formData.meningitis"
);
// 12. photo
replaceClass(
  /(<select value=\{formData\.photo \? 'Sudah Ada' : 'Belum Ada'\}.*?)className="([^"]+)"(>)/,
  "formData.photo"
);
// 13. sabuk
replaceClass(
  /(<select \s*value=\{formData\.sabuk \|\| ''\}.*?)className="([^"]+)"(>)/,
  "formData.sabuk"
);
// 14. paymentMethod
replaceClass(
  /(<select \s*value=\{\(formData as any\)\.paymentMethod \|\| ''\}.*?)className="([^"]+)"(>)/,
  "(formData as any).paymentMethod"
);
// 15. paymentNotes
replaceClass(
  /(<Input \s*value=\{\(formData as any\)\.paymentNotes[^\}]+\}.*?)className="([^"]+)"(>|\s*\/>)/,
  "(formData as any).paymentNotes"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated input classes.");
