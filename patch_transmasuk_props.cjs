const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

code = code.replace(
  `  onProcessTransaksi: (t: Omit<BarangMasuk, 'id' | 'tanggal'>) => void;`,
  `  onProcessTransaksi: (t: Omit<BarangMasuk, 'id' | 'tanggal'>, langsungKeluar?: { unitId: string, keperluan: string, petugas: string, catatan: string }) => void;
  unitList?: any[];`
);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
