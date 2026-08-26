const fs = require('fs'); let code = fs.readFileSync('src/features/journey/Journey.tsx', 'utf8'); code = code.replace(/green/g, 'red'); fs.writeFileSync('src/features/journey/Journey.tsx', code);
