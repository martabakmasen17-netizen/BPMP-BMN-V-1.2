/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, X, PlusCircle, FileText, ArrowDownLeft, Upload, FileUp, 
  AlertCircle, Sparkles, QrCode, Download, FolderTree, Package, 
  History, ArrowLeft, Filter, RefreshCw, CheckCircle2, ShieldAlert,
  Calendar, UserCheck, Truck, LayoutGrid, FileCheck, Copy, Check,
  Trash2, FileSpreadsheet
} from 'lucide-react';
import { Barang, Kategori, Supplier, BarangMasuk, Pegawai } from '../types';
import QRScannerModal from './QRScannerModal';

interface TransaksiMasukViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  supplierList: Supplier[];
  transaksiList: BarangMasuk[];
  onProcessTransaksi: (t: Omit<BarangMasuk, 'id' | 'tanggal'>) => void;
  onDeleteTransaksi?: (ids: string[]) => void;
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
  onDeleteTransaksi,
  currentUserRole,
  quickAddBarangId,
  clearQuickAdd,
  pegawaiList,
  folderId
}: TransaksiMasukViewProps) {
  // View Mode: 'split' | 'form' | 'history'
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'history'>('split');

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const isAdmin = currentUserRole === 'Administrator';

  // Category & Item State
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [selectedKategoriId, setSelectedKategoriId] = useState<string>(() => {
    if (quickAddBarangId) {
      const b = barangList.find(x => x.id === quickAddBarangId);
      if (b) return b.kategoriId || kategoriList.find(k => k.nama === b.kategori)?.id || (kategoriList[0]?.id || '');
    }
    return kategoriList[0]?.id || '';
  });

  const selectedCategoryObj = kategoriList.find(k => k.id === selectedKategoriId || k.nama === selectedKategoriId);

  // Filter category list based on category search term (kode or nama)
  const searchableKategoriList = kategoriList.filter(k => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.toLowerCase();
    return k.id.toLowerCase().includes(q) || k.nama.toLowerCase().includes(q);
  });

  // Filter items that belong to selected category
  const filteredBarangList = barangList.filter(b => {
    if (selectedKategoriId) {
      return b.kategoriId === selectedKategoriId || (selectedCategoryObj && b.kategori === selectedCategoryObj.nama);
    }
    return true;
  });

  // Filter items based on item search term (kode, nama, or rak)
  const searchableBarangList = filteredBarangList.filter(b => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.nama.toLowerCase().includes(q) ||
      (b.lokasiRak && b.lokasiRak.toLowerCase().includes(q))
    );
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
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
    setShowConfirmModal(false);
    if (clearQuickAdd) clearQuickAdd();
  };

  const selectedItem = barangList.find(b => b.id === selectedBarangId);

  // Available month options
  const availableMonths = Array.from(
    new Set(
      transaksiList
        .map(t => (t.tanggal ? t.tanggal.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  // Filter history list
  const filteredTransaksiList = transaksiList.filter(t => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.namaBarang.toLowerCase().includes(q) ||
      t.supplier.toLowerCase().includes(q) ||
      t.petugas.toLowerCase().includes(q) ||
      (t.catatan && t.catatan.toLowerCase().includes(q));

    const matchesMonth =
      selectedMonth === 'all' ? true : t.tanggal && t.tanggal.startsWith(selectedMonth);

    return matchesSearch && matchesMonth;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTransaksiList.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSelected = () => {
    if (onDeleteTransaksi && selectedIds.length > 0) {
      onDeleteTransaksi(selectedIds);
      setSelectedIds([]);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID Transaksi,Tanggal,Kode Barang,Nama Barang,Volume,Supplier,Petugas,Catatan\n';
    const rows = filteredTransaksiList
      .map(
        t =>
          `"${t.id}","${new Date(t.tanggal).toLocaleDateString()}","${t.barangId}","${
            t.namaBarang
          }",+${t.jumlah},"${t.supplier}","${t.petugas}","${(t.catatan || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Rekap_Barang_Masuk_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalVolumeMasuk = transaksiList.reduce((acc, curr) => acc + curr.jumlah, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal for Admin */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                KONFIRMASI PEMBERSIHAN BARANG MASUK
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="p-1 hover:bg-red-700 rounded-lg text-red-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-slate-700">
              <p className="font-semibold text-slate-900">
                Apakah Anda yakin ingin menghapus <strong className="text-red-600 font-bold">{selectedIds.length} transaksi barang masuk</strong> yang dipilih?
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>PERHATIAN (ADMIN ONLY):</strong> Pembersihan transaksi ini akan diperbarui ke database dan Google Sheets secara permanen. Disarankan untuk mengunduh rekap CSV terlebih dahulu.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus {selectedIds.length} Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Confirmation Popup Modal for Barang Masuk */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                KONFIRMASI PENERIMAAN BARANG MASUK
              </span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-slate-700">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>KONFIRMASI STOK:</strong> Transaksi penerimaan barang ini akan ditambahkan ke persediaan BMN secara otomatis.
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Nama Item:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedItem.nama} ({selectedItem.id})</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Volume Masuk:</span>
                  <span className="col-span-2 font-bold text-emerald-600 text-sm">+{jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Estimasi Stok Baru:</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {selectedItem.stokSekarang + jumlah} {selectedItem.satuan}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Penyedia / Supplier:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedSupplier || '-'}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Petugas Penerima:</span>
                  <span className="col-span-2 font-medium text-gray-800">{petugas}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Dokumen Lampiran:</span>
                  <span className="col-span-2 font-medium text-blue-700 truncate">
                    {uploadedFile || 'Dokumen_Penerimaan_Fisik_signed.pdf'}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <span className="text-gray-500 font-semibold">Catatan / BAP:</span>
                  <span className="col-span-2 text-gray-900 italic font-medium">"{catatan || 'Penerimaan rutin persediaan BMN'}"</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal / Perbaiki Form
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Ya, Konfirmasi Simpan Barang Masuk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ArrowDownLeft className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Mutasi Masuk Stock
              </span>
              <span className="text-slate-400 text-xs">SIP-BMN Digital Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Penerimaan & Mutasi Barang Masuk
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
              Catat penerimaan BMN baru, unggah bukti dokumen faktur/surat jalan, dan perbarui stok persediaan secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Barang
            </button>
          </div>
        </div>

        {/* Stats Metrics Sub-bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Mutasi Masuk</span>
              <span className="text-base font-bold text-white">{transaksiList.length} Transaksi</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Volume Diterima</span>
              <span className="text-base font-bold text-white">+{totalVolumeMasuk} Item</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Supplier Aktif</span>
              <span className="text-base font-bold text-white">{supplierList.length} Mitra Vendor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Controls for View Switching */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <LayoutGrid className="w-4 h-4 text-emerald-600" />
          <span>Tampilan Tata Letak:</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'split' 
                ? 'bg-white text-emerald-700 font-bold shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Berdampingan (Split)
          </button>
          <button
            onClick={() => setViewMode('form')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'form' 
                ? 'bg-white text-emerald-700 font-bold shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Form Input
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'history' 
                ? 'bg-white text-emerald-700 font-bold shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat ({transaksiList.length})
          </button>
        </div>
      </div>

      {/* Core Dynamic Content Layout */}
      <div className={
        viewMode === 'split' 
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' 
          : 'space-y-6'
      }>

        {/* --- FORM INPUT CONTAINER --- */}
        {(viewMode === 'split' || viewMode === 'form') && (
          <div className={
            viewMode === 'split' 
              ? 'lg:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden' 
              : 'max-w-3xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'
          }>
            <div className="bg-slate-50 border-b border-gray-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  Form Input Penerimaan BMN
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Isi detail kuantitas dan sumber dokumen persediaan</p>
              </div>

              <span className="text-[10px] font-mono px-2 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-lg">
                STEP FORM
              </span>
            </div>

            <div className="p-5">
              {isReadOnly ? (
                <div className="p-6 bg-amber-50/60 border border-amber-200/60 rounded-xl text-center text-xs text-amber-800 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-500" />
                  <p className="font-bold">Akses Terbatas</p>
                  <p>Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk melakukan mutasi masuk barang.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">

                  {/* STEP 1: KATEGORI & BARANG */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-3">
                    {/* 1. Kategori Selection with Live Search */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-gray-700 font-bold flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
                          1. Pilih Kategori Barang *
                        </label>
                        {selectedCategoryObj && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md font-mono">
                            {selectedCategoryObj.id}
                          </span>
                        )}
                      </div>
                      
                      {/* Search box for category */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama atau kode kategori (e.g. 1010301001 / ALAT TULIS)..."
                          value={categorySearch}
                          onChange={e => setCategorySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <select
                        required
                        value={selectedKategoriId}
                        onChange={e => handleKategoriChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-gray-900"
                      >
                        {searchableKategoriList.length === 0 ? (
                          <option value="">(Tidak ditemukan kategori: "{categorySearch}")</option>
                        ) : (
                          searchableKategoriList.map(k => (
                            <option key={k.id} value={k.id}>
                              [{k.id}] - {k.nama}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* 2. Item Selection with Live Search */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between items-center">
                        <label className="block text-gray-700 font-bold flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                          2. Pilih Item Barang Masuk *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                        >
                          <QrCode className="w-3 h-3" /> Scan Barcode
                        </button>
                      </div>

                      {/* Search box for item */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari kode atau nama barang dalam kategori ini..."
                          value={itemSearch}
                          onChange={e => setItemSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <select
                        required
                        value={selectedBarangId}
                        onChange={e => handleBarangChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-gray-900"
                      >
                        {searchableBarangList.length === 0 ? (
                          <option value="">
                            {filteredBarangList.length === 0 
                              ? '(Tidak ada barang di kategori ini)' 
                              : `(Tidak ditemukan barang: "${itemSearch}")`}
                          </option>
                        ) : (
                          searchableBarangList.map(b => (
                            <option key={b.id} value={b.id}>
                              [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Live Preview Card of Selected Item */}
                    {selectedItem && (
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl text-[11px] grid grid-cols-2 gap-2 text-slate-600 shadow-2xs">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Stok Saat Ini:</span>
                          <span className="font-bold text-gray-900 text-xs">
                            {selectedItem.stokSekarang} {selectedItem.satuan}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Lokasi Penempatan Rak:</span>
                          <span className="font-bold text-slate-800 text-xs">{selectedItem.lokasiRak || 'Gudang Utama'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: DETAILS MUTASI */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-gray-700 font-bold flex items-center gap-1">
                        3. Kuantitas Volume Masuk *
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => setJumlah(Math.max(1, jumlah - 5))}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={1}
                            required
                            value={jumlah}
                            onChange={e => setJumlah(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 text-center font-bold text-emerald-700 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setJumlah(jumlah + 1)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => setJumlah(jumlah + 5)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200"
                          >
                            +5
                          </button>
                        </div>

                        <span className="px-3 py-2 bg-slate-100 border border-gray-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center">
                          {selectedItem?.satuan || 'Pcs'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Supplier */}
                      <div className="space-y-1">
                        <label className="block text-gray-700 font-bold flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-gray-400" />
                          4. Supplier Penyedia *
                        </label>
                        <select
                          value={selectedSupplier}
                          onChange={e => setSelectedSupplier(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                        <label className="block text-gray-700 font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          5. Petugas Penerima BMN *
                        </label>
                        <select
                          required
                          value={petugas}
                          onChange={e => setPetugas(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                    </div>
                  </div>

                  {/* STEP 3: DOCUMENT UPLOAD */}
                  <div className="space-y-1">
                    <label className="block text-gray-700 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-gray-400" />
                        6. Unggah Faktur / Surat Jalan (Drive PDF)
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">Opsional</span>
                    </label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                        isDragging ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        id="trans-file-in"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="trans-file-in" className="cursor-pointer space-y-1 block">
                        <FileUp className="w-5 h-5 mx-auto text-emerald-600" />
                        <div className="text-[11px] text-gray-700 font-bold">
                          {uploadedFile ? (
                            <span className="text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {uploadedFile}
                            </span>
                          ) : (
                            'Tarik file di sini, atau klik untuk memilih'
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400">Format PDF, JPG, PNG (Max 10MB)</p>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="block text-gray-700 font-bold">Catatan Penerimaan / No. BAP</label>
                    <textarea
                      rows={2}
                      placeholder="Nomor Berita Acara Penerimaan atau catatan fisik..."
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Simpan Penerimaan Barang Masuk
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- TRANSACTIONS HISTORY TABLE CONTAINER --- */}
        {(viewMode === 'split' || viewMode === 'history') && (
          <div className={
            viewMode === 'split' 
              ? 'lg:col-span-7 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden' 
              : 'w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'
          }>
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Riwayat Mutasi Barang Masuk
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Menampilkan {filteredTransaksiList.length} dari {transaksiList.length} total transaksi
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && selectedIds.length > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirmModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedIds.length})
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" /> Export CSV
                </button>

                {/* Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="all">🗓️ Semua Bulan</option>
                  {availableMonths.map(m => {
                    const [yr, mo] = m.split('-');
                    const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
                    const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {monthLabel}
                      </option>
                    );
                  })}
                </select>

                {/* Search Box */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari ID, Barang..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                    {isAdmin && (
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredTransaksiList.length && filteredTransaksiList.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                      </th>
                    )}
                    <th className="p-3">ID Transaksi / Waktu</th>
                    <th className="p-3">Item Barang</th>
                    <th className="p-3 text-center">Volume</th>
                    <th className="p-3">Supplier & Petugas</th>
                    <th className="p-3 text-right">Faktur (Drive)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                  {filteredTransaksiList.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-gray-400">
                        <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        Belum ada transaksi barang masuk yang tercatat / cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredTransaksiList.map((t, idx) => (
                      <tr key={`${t.id}_${idx}`} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(t.id) ? 'bg-emerald-50/40' : ''}`}>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={() => handleToggleSelectRow(t.id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                            />
                          </td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-900 text-xs">{t.id}</span>
                            <button
                              onClick={() => copyToClipboard(t.id)}
                              className="text-gray-400 hover:text-gray-600 p-0.5"
                              title="Salin Kode ID"
                            >
                              {copiedId === t.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(t.tanggal).toLocaleDateString('id-ID')} - {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{t.namaBarang}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {t.barangId}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-xs">
                            +{t.jumlah}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-800 font-semibold block truncate max-w-[140px]">{t.supplier}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 truncate max-w-[140px]">Oleh: {t.petugas}</span>
                        </td>
                        <td className="p-3 text-right">
                          {t.fileData ? (
                            <a
                              href={t.fileData}
                              download={t.fileDokumen || 'Dokumen_Persediaan.pdf'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] text-red-700 font-mono font-bold transition-all cursor-pointer"
                              title="Klik untuk mengunduh dokumen PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-red-600" />
                              <span className="truncate max-w-[100px]">{t.fileDokumen}</span>
                              <Download className="w-3 h-3 text-red-500 shrink-0" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-mono">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[100px]">{t.fileDokumen || '-'}</span>
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
        )}
      </div>
    </div>
  );
}
