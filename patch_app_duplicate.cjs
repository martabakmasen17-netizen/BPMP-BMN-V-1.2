const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                  pegawaiList={pegawaiList}
                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  pegawaiList={pegawaiList}`,
  `                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  pegawaiList={pegawaiList}`
);

fs.writeFileSync('src/App.tsx', code);
