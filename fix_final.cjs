const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the start of the ternary
content = content.replace('{!editingPilgrim ? (\n                <>\n', '');

// Replace the end of the ternary
content = content.replace('                </>\n              )}\n              {/* ACTION BUTTONS */}', '              {/* ACTION BUTTONS */}');

// Just in case it has `{/* ACTION BUTTONS */}` left
content = content.replace('                {/* ACTION BUTTONS */}\n                </>\n              )}\n              {/* ACTION BUTTONS */}', '              {/* ACTION BUTTONS */}');
content = content.replace('                </>\n              )}\n              {/* ACTION BUTTONS */}', '              {/* ACTION BUTTONS */}');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed ternary!");
