const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `    // 5. Trigger system notification`;

const injection = `    // Handle Langsung Keluar jika ada
    if (langsungKeluar) {
       handleProcessTransaksiKeluar({
         barangId: trans.barangId,
         namaBarang: trans.namaBarang,
         jumlah: trans.jumlah,
         unitId: langsungKeluar.unitId,
         petugas: langsungKeluar.petugas,
         keperluan: langsungKeluar.keperluan,
         catatan: langsungKeluar.catatan
       });
    }

    // 5. Trigger system notification`;

code = code.replace(anchor, injection);
fs.writeFileSync('src/App.tsx', code);
