const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

code = code.replace(
  `  const handleConfirmSubmit = () => {
    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: barangList.find(b => b.id === selectedBarangId)?.nama || '',
      jumlah,
      supplier: selectedSupplier,
      petugas,
      fileDokumen: uploadedFile || 'Dokumen_Penerimaan_Fisik_signed.pdf',
      fileData: uploadedFileData,
      catatan
    });`,
  `  const handleConfirmSubmit = () => {
    const masukPayload = {
      barangId: selectedBarangId,
      namaBarang: barangList.find(b => b.id === selectedBarangId)?.nama || '',
      jumlah,
      supplier: selectedSupplier,
      petugas,
      fileDokumen: uploadedFile || 'Dokumen_Penerimaan_Fisik_signed.pdf',
      fileData: uploadedFileData,
      catatan
    };
    
    if (isLangsungKeluar) {
      onProcessTransaksi(masukPayload, {
        unitId: lkUnitId,
        keperluan: lkKeperluan,
        petugas,
        catatan: lkCatatan
      });
    } else {
      onProcessTransaksi(masukPayload);
    }`
);

code = code.replace(
  `    setUploadedFileData('');
    setShowConfirmModal(false);
    if (clearQuickAdd) clearQuickAdd();
  };`,
  `    setUploadedFileData('');
    setIsLangsungKeluar(false);
    setLkCatatan('');
    setShowConfirmModal(false);
    if (clearQuickAdd) clearQuickAdd();
  };`
);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
