const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                  unitList={unitList}
                  pegawaiList={pegawaiList}
                  onDeleteTransaksi={handleDeleteBarangMasuk}
                  currentUserRole={currentRole}
                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  pegawaiList={pegawaiList}
                  folderId={settings?.folderDokumenId || settings?.folderReportsId}`,
  `                  unitList={unitList}
                  pegawaiList={pegawaiList}
                  onDeleteTransaksi={handleDeleteBarangMasuk}
                  currentUserRole={currentRole}
                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  folderId={settings?.folderDokumenId || settings?.folderReportsId}`
);

fs.writeFileSync('src/App.tsx', code);
