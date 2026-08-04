const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

const importTarget = `import { Package, Search, PlusCircle, Filter, CalendarDays, History, AlertCircle, Save, QrCode, FileText, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';`;
if (code.includes(importTarget)) {
   code = code.replace(importTarget, `import { Package, Search, PlusCircle, Filter, CalendarDays, History, AlertCircle, Save, QrCode, FileText, Upload, CheckCircle2, ShieldAlert, X } from 'lucide-react';`);
} else {
   code = code.replace(`import { Package, Search`, `import { Package, Search, X`);
}

const stateTarget = `  const [isScannerOpen, setIsScannerOpen] = useState(false);`;
const stateReplacement = `  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);`;
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

const selectTarget = `            {/* STEP 2: ITEM BARANG (FILTERED BY CATEGORY) */}
            <div className="space-y-1">
              <label className="block text-gray-500 font-bold flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                2. Pilih Item Barang Dalam Kategori *
              </label>
              {filteredBarangList.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                  Belum ada item barang terdaftar di kategori ini. Silakan pilih kategori lain atau tambah barang baru di Katalog.
                </div>
              ) : (
                <select
                  required
                  value={selectedBarangId}
                  onChange={e => handleBarangChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-gray-900"
                >
                  {filteredBarangList.map((b, idx) => (
                    <option key={\`\${b.id}-\${b.kategoriId}-\${idx}\`} value={b.id}>
                      [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan})
                    </option>
                  ))}
                </select>
              )}`;
const selectReplacement = `            {/* STEP 2: ITEM BARANG (FILTERED BY CATEGORY) */}
            <div className="space-y-1">
              <label className="block text-gray-500 font-bold flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-600" />
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
                    // auto select first match if available
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
                  {searchTerm ? 'Barang tidak ditemukan untuk pencarian ini.' : 'Belum ada item barang terdaftar di kategori ini. Silakan pilih kategori lain atau tambah barang baru di Katalog.'}
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
                    <option key={\`\${b.id}-\${b.kategoriId}-\${idx}\`} value={b.id}>
                      [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan})
                    </option>
                  ))}
                </select>
              )}`;
code = code.replace(selectTarget, selectReplacement);

const submitTarget = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedBarangId || jumlah <= 0) {
      alert("Silakan pilih item barang dan isi jumlah volume masuk terlebih dahulu.");
      return;
    }

    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: barangList.find(b => b.id === selectedBarangId)?.nama || '',
      jumlah,
      supplier: selectedSupplier,
      petugas,
      fileDokumen: uploadedFile || 'Dokumen_Penerimaan_Fisik_signed.pdf',
      fileData: uploadedFileData,
      catatan
    });

    setJumlah(10);
    setCatatan('');
    setUploadedFile('');
    setUploadedFileData(undefined);
  };`;

const submitReplacement = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedBarangId || jumlah <= 0) {
      alert("Silakan pilih item barang dan isi jumlah volume masuk terlebih dahulu.");
      return;
    }
    setShowConfirmModal(true);
  };

  const processConfirm = () => {
    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: barangList.find(b => b.id === selectedBarangId)?.nama || '',
      jumlah,
      supplier: selectedSupplier,
      petugas,
      fileDokumen: uploadedFile || 'Dokumen_Penerimaan_Fisik_signed.pdf',
      fileData: uploadedFileData,
      catatan
    });

    setJumlah(10);
    setCatatan('');
    setSearchTerm('');
    setUploadedFile('');
    setUploadedFileData(undefined);
    setShowConfirmModal(false);
  };`;
code = code.replace(submitTarget, submitReplacement);

const modalTarget = `      {/* Scanner Modal */}`;
const modalReplacement = `      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Konfirmasi Transaksi</h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-sm text-gray-600">
              Apakah Anda yakin ingin memproses Barang Masuk ini?
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <p><strong>Item:</strong> {barangList.find(b => b.id === selectedBarangId)?.nama}</p>
                <p><strong>Jumlah:</strong> {jumlah}</p>
                <p><strong>Supplier:</strong> {selectedSupplier}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-50 font-bold text-gray-600 text-sm"
              >
                Batal
              </button>
              <button
                onClick={processConfirm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
              >
                Ya, Proses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}`;
code = code.replace(modalTarget, modalReplacement);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
