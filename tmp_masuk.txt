/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, X, PlusCircle, FileText, ArrowDownLeft, Upload, FileUp, AlertCircle, Sparkles, QrCode, Download, FolderTree, Package } from 'lucide-react';
import { Barang, Kategori, Supplier, BarangMasuk, Pegawai } from '../types';
import QRScannerModal from './QRScannerModal';

interface TransaksiMasukViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  supplierList: Supplier[];
  transaksiList: BarangMasuk[];
  onProcessTransaksi: (t: Omit<BarangMasuk, 'id' | 'tanggal'>) => void;
  currentUserRole: string;
  quickAddBarangId?: string;
  clearQuickAdd?: () => void;
  pegawaiList: Pegawai[];
  folderId?: string;
}

export default function TransaksiMasukView({
  barangList,
  kategoriList = [],
  supplierList,
  transaksiList,
  onProcessTransaksi,
  currentUserRole,
  quickAddBarangId,
  clearQuickAdd,
  pegawaiList,
  folderId
}: TransaksiMasukViewProps) {
  // Category & Item State
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>(() => {
    if (quickAddBarangId) {
      const b = barangList.find(x => x.id === quickAddBarangId);
      if (b) return b.kategoriId || kategoriList.find(k => k.nama === b.kategori)?.id || (kategoriList[0]?.id || '');
    }
    return kategoriList[0]?.id || '';
  });

  const selectedCategoryObj = kategoriList.find(k => k.id === selectedKategoriId || k.nama === selectedKategoriId);

  // Filter items that belong to selected category
  const filteredBarangList = barangList.filter(b => {
    if (selectedKategoriId) {
      return b.kategoriId === selectedKategoriId || (selectedCategoryObj && b.kategori === selectedCategoryObj.nama);
    }
    return true;
  });

  const [selectedBarangId, setSelectedBarangId] = useState<string>(() => {
    if (quickAddBarangId) return quickAddBarangId;
    return filteredBarangList[0]?.id || '';
  });

  const [jumlah, setJumlah] = useState<number>(10);
  const [selectedSupplier, setSelectedSupplier] = useState(supplierList[0]?.nama || '');
  const [petugas, setPetugas] = useState(() => pegawaiList?.[0]?.nama || 'Roni Setiawan');
  const [catatan, setCatatan] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // When category changes, auto-select first item under that category
  const handleKategoriChange = (katId: string) => {
    setSelectedKategoriId(katId);
    const cat = kategoriList.find(k => k.id === katId || k.nama === katId);
    const items = barangList.filter(b => b.kategoriId === katId || (cat && b.kategori === cat.nama));
    if (items.length > 0) {
      setSelectedBarangId(items[0].id);
      if (items[0].supplier) setSelectedSupplier(items[0].supplier);
    } else {
      setSelectedBarangId('');
    }
  };

  // Drag and drop / upload simulation
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [uploadedFileData, setUploadedFileData] = useState<string>('');
  const [isUploadingDrive, setIsUploadingDrive] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);

  const processSelectedFile = (file: File) => {
    setUploadedFile(file.name);
    setIsUploadingDrive(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedFileData(base64 || '');
      setIsUploadingDrive(false);

      fetch('/api/drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileData: base64,
          folderId: folderId
        })
      }).catch(err => console.log('Drive background upload handled locally:', err));
    };
    reader.onerror = () => {
      setIsUploadingDrive(false);
    };
    reader.readAsDataURL(file);
  };

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  // React to quickAddBarangId from dashboard
  useEffect(() => {
    if (quickAddBarangId) {
      const matched = barangList.find(b => b.id === quickAddBarangId);
      if (matched) {
        const cat = kategoriList.find(k => k.nama === matched.kategori || k.id === matched.kategoriId);
        if (cat) setSelectedKategoriId(cat.id);
        setSelectedBarangId(matched.id);
        if (matched.supplier) setSelectedSupplier(matched.supplier);
      }
    }
  }, [quickAddBarangId, barangList, kategoriList]);

  // Sync petugas when pegawaiList loads
  useEffect(() => {
    if (pegawaiList && pegawaiList.length > 0 && !petugas) {
      setPetugas(pegawaiList[0].nama);
    }
  }, [pegawaiList, petugas]);

  const handleBarangChange = (id: string) => {
    setSelectedBarangId(id);
    const matchedItem = barangList.find(b => b.id === id);
    if (matchedItem && matchedItem.supplier) {
      setSelectedSupplier(matchedItem.supplier);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    setUploadedFileData('');
    if (clearQuickAdd) clearQuickAdd();
  };

  const selectedItem = barangList.find(b => b.id === selectedBarangId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* QR Scanner Modal overlay */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code, item, category) => {
          if (category) {
            handleKategoriChange(category.id);
          } else if (item) {
            const cat = kategoriList.find(k => k.nama === item.kategori || k.id === item.kategoriId);
            if (cat) setSelectedKategoriId(cat.id);
            setSelectedBarangId(item.id);
          }
        }}
        barangList={barangList}
        kategoriList={kategoriList}
      />

      {/* Transaction form */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-1 h-fit">
        <div className="border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <ArrowDownLeft className="w-4.5 h-4.5 text-green-500 bg-green-50 p-0.5 rounded" />
            Input Penerimaan Barang Masuk
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
        </div>

        {isReadOnly ? (
          <div className="p-4 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
            Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk melakukan mutasi masuk barang.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
            {/* STEP 1: KATEGORI BARANG */}
            <div className="space-y-1">
              <label className="block text-gray-500 font-bold flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                1. Pilih Kategori Barang *
              </label>
              <div className="flex gap-2">
                <select
                  required
                  value={selectedKategoriId}
                  onChange={e => handleKategoriChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none min-w-0 font-medium text-gray-900"
                >
                  {kategoriList.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.id} - {k.nama}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Pindai Barcode Kategori"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">Pindai QR</span>
                </button>
              </div>
            </div>

            {/* STEP 2: ITEM BARANG (FILTERED BY CATEGORY) */}
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
                    <option key={`${b.id}-${b.kategoriId}-${idx}`} value={b.id}>
                      [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick specifications display */}
            {selectedItem && (
              <div className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl text-[11px] grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="text-gray-400 block">Stok Sekarang:</span>
                  <span className="font-bold text-gray-900">{selectedItem.stokSekarang} {selectedItem.satuan}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Penempatan Rak:</span>
                  <span className="font-bold text-gray-900">{selectedItem.lokasiRak}</span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-1">
              <label className="block text-gray-500">Jumlah Volume Masuk *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={jumlah}
                  onChange={e => setJumlah(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-gray-900"
                />
                <span className="px-3.5 py-2 bg-slate-100 border border-gray-200 text-gray-500 font-bold rounded-xl flex items-center justify-center">
                  {selectedItem?.satuan || 'Pcs'}
                </span>
              </div>
            </div>

            {/* Supplier */}
            <div className="space-y-1">
              <label className="block text-gray-500">Supplier Penyedia *</label>
              <select
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {supplierList.map(s => (
                  <option key={s.id} value={s.nama}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer */}
            <div className="space-y-1">
              <label className="block text-gray-500">Petugas Penerima BMN *</label>
              <select
                required
                value={petugas}
                onChange={e => setPetugas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {pegawaiList && pegawaiList.length > 0 ? (
                  pegawaiList.map(p => (
                    <option key={p.id} value={p.nama}>
                      {p.nama} ({p.jabatan})
                    </option>
                  ))
                ) : (
                  <option value="Roni Setiawan">Roni Setiawan (Petugas BMN)</option>
                )}
              </select>
            </div>

            {/* Simulated Document Upload */}
            <div className="space-y-1">
              <label className="block text-gray-500">Unggah Faktur / Surat Jalan (Simulasi Drive)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="trans-file-in"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="trans-file-in" className="cursor-pointer space-y-1.5 block">
                  <FileUp className="w-6 h-6 mx-auto text-gray-400" />
                  <div className="text-[11px] text-gray-600 font-bold">
                    {uploadedFile ? (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        ✓ {uploadedFile}
                      </span>
                    ) : (
                      'Tarik file di sini, atau klik untuk memilih'
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400">PDF, JPG, PNG maks 10MB (Disimpan di folder Reports)</p>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-gray-500">Catatan Penerimaan</label>
              <textarea
                rows={2}
                placeholder="Tuliskan nomor Berita Acara Penerimaan atau catatan fisik barang..."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
            >
              Simpan Barang Masuk
            </button>
          </form>
        )}
      </div>

      {/* Transactions list */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-2">
        <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
          <span>Daftar Riwayat Barang Masuk Baru</span>
          <span className="text-xs text-gray-400 font-semibold">{transaksiList.length} Transaksi</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">ID Transaksi / Tanggal</th>
                <th className="p-3">Barang</th>
                <th className="p-3 text-center">Jumlah</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Faktur (Drive)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Belum ada transaksi barang masuk dicatat
                  </td>
                </tr>
              ) : (
                transaksiList.map((t, idx) => (
                  <tr key={`${t.id}_${idx}`} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-gray-900 block">{t.id}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {new Date(t.tanggal).toLocaleDateString('id-ID')} - {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-gray-900 block">{t.namaBarang}</span>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {t.barangId}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 font-bold rounded-lg">
                        +{t.jumlah}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-700 block truncate max-w-[150px]">{t.supplier}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5 truncate max-w-[150px]">Oleh: {t.petugas}</span>
                    </td>
                    <td className="p-3">
                      {t.fileData ? (
                        <a
                          href={t.fileData}
                          download={t.fileDokumen || 'Dokumen_Persediaan.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] text-red-700 font-mono font-bold transition-all cursor-pointer"
                          title="Klik untuk mengunduh / membuka dokumen PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span className="truncate max-w-[110px]">{t.fileDokumen}</span>
                          <Download className="w-3 h-3 text-red-500 shrink-0" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700 font-mono">
                          <FileText className="w-3 h-3 text-red-500" />
                          <span className="truncate max-w-[120px]">{t.fileDokumen || '-'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
