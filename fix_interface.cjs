const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

code = code.replace(
  `  unitList?: any[];
  pegawaiList?: any[];
  onDeleteTransaksi?: (ids: string[]) => void;
  currentUserRole: string;
  quickAddBarangId?: string;
  clearQuickAdd?: () => void;
  pegawaiList: Pegawai[];`,
  `  unitList: Unit[];
  pegawaiList: Pegawai[];
  onDeleteTransaksi?: (ids: string[]) => void;
  currentUserRole: string;
  quickAddBarangId?: string;
  clearQuickAdd?: () => void;`
);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
