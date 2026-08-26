const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
for(let i = 1585; i < 1610; i++) {
    console.log(i + 1 + ": " + lines[i]);
}
