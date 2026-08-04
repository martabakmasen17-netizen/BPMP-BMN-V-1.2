const fs = require('fs');
let code = fs.readFileSync('src/components/BarangView.tsx', 'utf8');

if (!code.includes('QRCodeCanvas }')) {
  code = code.replace(
    "import { Barang, Kategori, Unit, Supplier, Satuan } from '../types';",
    "import { Barang, Kategori, Unit, Supplier, Satuan } from '../types';\nimport { QRCodeCanvas } from 'qrcode.react';"
  );
  fs.writeFileSync('src/components/BarangView.tsx', code);
}
