const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace("const result = await response.json();", "const result = await response.json() as any;");

fs.writeFileSync('api/index.ts', code);
