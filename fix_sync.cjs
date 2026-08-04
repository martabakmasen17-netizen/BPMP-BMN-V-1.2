const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add skipNextSaveRef
code = code.replace(
  "const firstLoadRef = React.useRef(true);",
  "const firstLoadRef = React.useRef(true);\n  const skipNextSaveRef = React.useRef(false);"
);

// 2. Set skipNextSaveRef = true before setting state in fetchData
code = code.replace(
  "if (data.Barang && data.Barang.length > 0) setBarangList(data.Barang);",
  "skipNextSaveRef.current = true;\n          if (data.Barang && data.Barang.length > 0) setBarangList(data.Barang);"
);

// 3. Handle it in the debounced save effect
const searchSaveEffect = "if (firstLoadRef.current) {\n      firstLoadRef.current = false;\n      return; // Skip save pada render pertama setelah loading\n    }";

const replaceSaveEffect = `if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return; 
    }
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }`;

code = code.replace(searchSaveEffect, replaceSaveEffect);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx fixed");
