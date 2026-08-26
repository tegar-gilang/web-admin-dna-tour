const fs = require('fs');
let code = fs.readFileSync('src/features/journey/Journey.tsx', 'utf8');

code = code.replace(
  /<motion\.div className="w-full bg-red-500"/g, 
  '<motion.div className="w-full bg-green-500"'
);

code = code.replace(/via-red-400/g, 'via-green-400');

code = code.replace(
  /bg-red-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-red-100 hover:bg-red-700/g, 
  'bg-green-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-green-100 hover:bg-green-700'
);

code = code.replace(
  /'border-red-200 bg-red-50\/30 border-l-4 border-l-red-600 shadow-2xs'/g, 
  "'border-green-200 bg-green-50/30 border-l-4 border-l-green-600 shadow-2xs'"
);

code = code.replace(
  /<CheckSquare className="w-4 h-4 text-red-600 shrink-0" \/>\s*<span className="font-bold text-red-700">Selesai<\/span>/g, 
  '<CheckSquare className="w-4 h-4 text-green-600 shrink-0" />\n                                      <span className="font-bold text-green-700">Selesai</span>'
);

fs.writeFileSync('src/features/journey/Journey.tsx', code);
