const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                  transaksiList={barangMasukList}
                  onProcessTransaksi={handleProcessTransaksiMasuk}`,
  `                  transaksiList={barangMasukList}
                  onProcessTransaksi={handleProcessTransaksiMasuk}
                  unitList={unitList}`
);

fs.writeFileSync('src/App.tsx', code);
