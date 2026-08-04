const fs = require('fs');

try {
  require('@babel/parser').parse(fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Masuk parsed OK");
} catch (e) {
  console.log("Masuk error:", e.message);
  console.log("Line:", e.loc);
}

try {
  require('@babel/parser').parse(fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Keluar parsed OK");
} catch (e) {
  console.log("Keluar error:", e.message);
  console.log("Line:", e.loc);
}
