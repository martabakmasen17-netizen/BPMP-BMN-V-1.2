const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const importTarget = `import { Package, Search, PlusCircle, Filter, CalendarDays, History, AlertCircle, Save, QrCode, ArrowUpRight, Check, X, ShieldAlert, XCircle } from 'lucide-react';`;
if (code.includes(importTarget)) {
   // Already has Search, but just in case
} else {
   code = code.replace(`import { Package,`, `import { Package, Search,`);
}

const stateTarget = `  const [isScannerOpen, setIsScannerOpen] = useState(false);`;
const stateReplacement = `  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');`;
code = code.replace(stateTarget, stateReplacement);

const filteredTarget = `  const filteredBarangList = barangList.filter(b => {
    const cat = kategoriList.find(k => k.id === selectedKategoriId);
    return b.kategoriId === selectedKategoriId || b.kategori === cat?.nama;
  });`;
const filteredReplacement = `  const filteredBarangList = barangList.filter(b => {
    const cat = kategoriList.find(k => k.id === selectedKategoriId);
    const matchesCategory = b.kategoriId === selectedKategoriId || b.kategori === cat?.nama;
    if (!searchTerm) return matchesCategory;
    const term = searchTerm.toLowerCase();
    return matchesCategory && (
      (b.nama || '').toLowerCase().includes(term) ||
      (b.id || '').toLowerCase().includes(term)
    );
  });`;
code = code.replace(filteredTarget, filteredReplacement);

const selectTarget = `              {/* STEP 2: ITEM BARANG (FILTERED BY CATEGORY) */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-bold flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-red-600" />
                  2. Pilih Item Barang Dalam Kategori *
                </label>
                {filteredBarangList.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                    Belum ada item barang terdaftar di kategori ini.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedBarangId}
                    onChange={e => handleBarangChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-gray-900"
                  >
                    {filteredBarangList.map((b, idx) => (
                      <option key={\`\${b.id}-\${b.kategoriId}-\${idx}\`} value={b.id} disabled={b.stokSekarang === 0}>
                        [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan}) {b.stokSekarang === 0 ? '[KOSONG]' : ''}
                      </option>
                    ))}
                  </select>
                )}`;
const selectReplacement = `              {/* STEP 2: ITEM BARANG (FILTERED BY CATEGORY) */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-bold flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-red-600" />
                  2. Pilih Item Barang Dalam Kategori *
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama / ID barang..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      const newFiltered = barangList.filter(b => {
                        const cat = kategoriList.find(k => k.id === selectedKategoriId);
                        const matchesCategory = b.kategoriId === selectedKategoriId || b.kategori === cat?.nama;
                        const term = e.target.value.toLowerCase();
                        return matchesCategory && ((b.nama || '').toLowerCase().includes(term) || (b.id || '').toLowerCase().includes(term));
                      });
                      if (newFiltered.length > 0 && !newFiltered.find(x => x.id === selectedBarangId)) {
                        setSelectedBarangId(newFiltered[0].id);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 mb-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-gray-900"
                  />
                </div>

                {filteredBarangList.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                    {searchTerm ? 'Barang tidak ditemukan untuk pencarian ini.' : 'Belum ada item barang terdaftar di kategori ini.'}
                  </div>
                ) : (
                  <select
                    required
                    value={selectedBarangId}
                    onChange={e => handleBarangChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-gray-900"
                    size={searchTerm ? 4 : 1}
                  >
                    {filteredBarangList.map((b, idx) => (
                      <option key={\`\${b.id}-\${b.kategoriId}-\${idx}\`} value={b.id} disabled={b.stokSekarang === 0}>
                        [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan}) {b.stokSekarang === 0 ? '[KOSONG]' : ''}
                      </option>
                    ))}
                  </select>
                )}`;
code = code.replace(selectTarget, selectReplacement);

// Check if setJumlah etc exist in handleConfirmSubmit
const confirmTarget = `  const handleConfirmSubmit = () => {
    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: selectedItem?.nama || '',
      jumlah,
      unitId: selectedUnitId,
      unitTujuan: unitList.find(u => u.id === selectedUnitId)?.nama || '',
      petugas,
      penerima,
      fileDokumen: uploadedFile || 'BAPB_signed.pdf',
      fileData: uploadedFileData,
      catatan
    });

    setShowConfirmModal(false);
    setJumlah(1);
    setCatatan('');
    setUploadedFile('');
    setUploadedFileData(undefined);
  };`;

const confirmReplacement = `  const handleConfirmSubmit = () => {
    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: selectedItem?.nama || '',
      jumlah,
      unitId: selectedUnitId,
      unitTujuan: unitList.find(u => u.id === selectedUnitId)?.nama || '',
      petugas,
      penerima,
      fileDokumen: uploadedFile || 'BAPB_signed.pdf',
      fileData: uploadedFileData,
      catatan
    });

    setShowConfirmModal(false);
    setSearchTerm('');
    setJumlah(1);
    setCatatan('');
    setUploadedFile('');
    setUploadedFileData(undefined);
  };`;
code = code.replace(confirmTarget, confirmReplacement);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', code);
