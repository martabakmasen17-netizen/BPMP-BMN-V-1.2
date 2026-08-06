const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
console.log(code.includes('handleProcessTransaksiKeluar('));
