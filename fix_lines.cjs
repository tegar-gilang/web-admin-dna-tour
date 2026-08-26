const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line with `{!editingPilgrim ? (`
const startIdx = lines.findIndex(l => l.includes('{!editingPilgrim ? ('));
if (startIdx !== -1) {
    // Remove it and the following `<>`
    lines.splice(startIdx, 2);
}

// Find the line with `</>` and `)}` near the bottom
let endIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(')}')) {
        if (lines[i-1].includes('</>')) {
            endIdx = i - 1;
            break;
        }
    }
}
if (endIdx !== -1) {
    // Remove `</>` and `)}`
    lines.splice(endIdx, 2);
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Lines fixed");
