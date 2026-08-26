const fs = require('fs');
let code = fs.readFileSync('src/features/journey/Journey.tsx', 'utf8');

// The segment line
code = code.replace(
  /\{status === 'completed' && \(\s*<motion\.div className="w-full bg-red-500"/,
  `{status === 'completed' && (\n                              <motion.div className="w-full bg-green-500"`
);

// The via-red-400 gradient
code = code.replace('via-red-400', 'via-green-400');

// The timeline node
code = code.replace(
  /bg-red-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-red-100 hover:bg-red-700/g,
  'bg-green-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-green-100 hover:bg-green-700'
);

// The timeline content card
code = code.replace(
  /'border-red-200 bg-red-50\/30 border-l-4 border-l-red-600 shadow-2xs'/g,
  "'border-green-200 bg-green-50/30 border-l-4 border-l-green-600 shadow-2xs'"
);

// The checklist button label inside timeline card
code = code.replace(
  /<CheckSquare className="w-4 h-4 text-red-600 shrink-0" \/>\s*<span className="font-bold text-red-700">Selesai<\/span>/g,
  `<CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
                                      <span className="font-bold text-green-700">Selesai</span>`
);

fs.writeFileSync('src/features/journey/Journey.tsx', code);
