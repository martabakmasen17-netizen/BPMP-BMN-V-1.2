const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  const handleProcessTransaksiMasuk = (trans: Omit<BarangMasuk, 'id' | 'tanggal'>) => {`,
  `  const handleProcessTransaksiMasuk = (trans: Omit<BarangMasuk, 'id' | 'tanggal'>, langsungKeluar?: { unitId: string, keperluan: string, petugas: string, catatan: string }) => {`
);

const originalMasukRiwayat = `    const newRiwayat: Riwayat = {
      id: newId,
      tanggal: timestamp,
      tipe: 'Masuk',
      barangId: trans.barangId,
      namaBarang: trans.namaBarang,
      jumlah: trans.jumlah,
      keterangan: \`Diterima dari \${trans.supplier}\`,
      petugas: trans.petugas
    };
    setRiwayatList(prev => [newRiwayat, ...prev]);

    writeAuditLog('Barang Masuk', \`Menerima barang "\${trans.namaBarang}" sejumlah \${trans.jumlah} dari \${trans.supplier}\`);
  };`;

const newMasukRiwayat = `    const newRiwayat: Riwayat = {
      id: newId,
      tanggal: timestamp,
      tipe: 'Masuk',
      barangId: trans.barangId,
      namaBarang: trans.namaBarang,
      jumlah: trans.jumlah,
      keterangan: \`Diterima dari \${trans.supplier}\`,
      petugas: trans.petugas
    };
    setRiwayatList(prev => [newRiwayat, ...prev]);

    writeAuditLog('Barang Masuk', \`Menerima barang "\${trans.namaBarang}" sejumlah \${trans.jumlah} dari \${trans.supplier}\`);
    
    // 5. Handle Langsung Keluar jika ada
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
  };`;

code = code.replace(originalMasukRiwayat, newMasukRiwayat);
fs.writeFileSync('src/App.tsx', code);
