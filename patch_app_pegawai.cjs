const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                  onProcessTransaksi={handleProcessTransaksiMasuk}
                  unitList={unitList}`,
  `                  onProcessTransaksi={handleProcessTransaksiMasuk}
                  unitList={unitList}
                  pegawaiList={pegawaiList}`
);

fs.writeFileSync('src/App.tsx', code);
