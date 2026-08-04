/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, Check, X, ShieldAlert, Clock, AlertTriangle, 
  Building, FileSpreadsheet, QrCode, FolderTree, Package, History, 
  ArrowLeft, Download, FileUp, FileText, LayoutGrid, CheckCircle2, 
  XCircle, Copy, UserCheck, AlertCircle, Sparkles, Trash2
} from 'lucide-react';
import { Barang, Kategori, Unit, BarangKeluar, Pegawai } from '../types';
import QRScannerModal from './QRScannerModal';

interface TransaksiKeluarViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  unitList: Unit[];
  transaksiList: BarangKeluar[];
  onProcessTransaksi: (t: Omit<BarangKeluar, 'id' | 'tanggal' | 'statusPersetujuan'>) => void;
  onApproveRejectTransaksi: (id: string, status: 'Disetujui' | 'Ditolak', notes?: string) => void;
  onDeleteTransaksi?: (ids: string[]) => void;
  currentUserRole: string;
  quickAddBarangId?: string;
  clearQuickAdd?: () => void;
  pegawaiList: Pegawai[];
}

export default function TransaksiKeluarView({
  barangList,
  kategoriList = [],
  unitList,
  transaksiList,
  onProcessTransaksi,
  onApproveRejectTransaksi,
  onDeleteTransaksi,
  currentUserRole,
  quickAddBarangId,
  clearQuickAdd,
  pegawaiList
}: TransaksiKeluarViewProps) {
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

  // Filter items by category
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

  const [jumlah, setJumlah] = useState<number>(1);
  const [selectedUnitId, setSelectedUnitId] = useState(unitList[0]?.nama || '');
  const [petugas, setPetugas] = useState(() => pegawaiList?.[0]?.nama || 'Roni Setiawan');
  const [keperluan, setKeperluan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle category selection change
  const handleKategoriChange = (katId: string) => {
    setSelectedKategoriId(katId);
    const cat = kategoriList.find(k => k.id === katId || k.nama === katId);
    const items = barangList.filter(b => b.kategoriId === katId || (cat && b.kategori === cat.nama));
    if (items.length > 0) {
      setSelectedBarangId(items[0].id);
    } else {
      setSelectedBarangId('');
    }
    setValidationError('');
  };

  // Sync petugas when pegawaiList loads
  useEffect(() => {
    if (pegawaiList && pegawaiList.length > 0 && !petugas) {
      setPetugas(pegawaiList[0].nama);
    }
  }, [pegawaiList, petugas]);

  // React to quickAddBarangId from dashboard
  useEffect(() => {
    if (quickAddBarangId) {
      const matched = barangList.find(b => b.id === quickAddBarangId);
      if (matched) {
        const cat = kategoriList.find(k => k.nama === matched.kategori || k.id === matched.kategoriId);
        if (cat) setSelectedKategoriId(cat.id);
        setSelectedBarangId(matched.id);
      }
    }
  }, [quickAddBarangId, barangList, kategoriList]);

  const isReadOnly = currentUserRole === 'Viewer';
  const isApprover = currentUserRole === 'Kepala Subbagian' || currentUserRole === 'Administrator';

  const selectedItem = barangList.find(b => b.id === selectedBarangId);

  const handleJumlahChange = (val: number) => {
    const validVal = Math.max(1, val);
    setJumlah(validVal);
    setValidationError('');
    if (selectedItem && validVal > selectedItem.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${selectedItem.stokSekarang} ${selectedItem.satuan}.`);
    }
  };

  const handleBarangChange = (id: string) => {
    setSelectedBarangId(id);
    const item = barangList.find(b => b.id === id);
    setValidationError('');
    if (item && jumlah > item.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${item.stokSekarang} ${item.satuan}.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedBarangId || jumlah <= 0) return;

    if (selectedItem && jumlah > selectedItem.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${selectedItem.stokSekarang} ${selectedItem.satuan}.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    onProcessTransaksi({
      barangId: selectedBarangId,
      namaBarang: selectedItem?.nama || '',
      jumlah,
      unitId: selectedUnitId,
      petugas,
      keperluan,
      catatan
    });

    // Reset
    setJumlah(1);
    setKeperluan('');
    setCatatan('');
    setValidationError('');
    setShowConfirmModal(false);
    if (clearQuickAdd) clearQuickAdd();
  };

  // Group requests
  const pendingRequests = transaksiList.filter(t => t.statusPersetujuan === 'Pending');
  const finalizedRequests = transaksiList.filter(t => t.statusPersetujuan !== 'Pending');

  // Available month options
  const availableMonths = Array.from(
    new Set(
      transaksiList
        .map(t => (t.tanggal ? t.tanggal.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  // Filter history list by search term and selected month
  const filteredFinalizedRequests = finalizedRequests.filter(t => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.namaBarang.toLowerCase().includes(q) ||
      t.unitId.toLowerCase().includes(q) ||
      t.petugas.toLowerCase().includes(q) ||
      (t.keperluan && t.keperluan.toLowerCase().includes(q));

    const matchesMonth =
      selectedMonth === 'all' ? true : t.tanggal && t.tanggal.startsWith(selectedMonth);

    return matchesSearch && matchesMonth;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredFinalizedRequests.map(t => t.id));
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
    const headers = 'ID Transaksi,Tanggal,Kode Barang,Nama Barang,Volume,Unit/Subbagian,Petugas,Keperluan,Status\n';
    const rows = filteredFinalizedRequests
      .map(
        t =>
          `"${t.id}","${new Date(t.tanggal).toLocaleDateString()}","${t.barangId}","${
            t.namaBarang
          }",-${t.jumlah},"${t.unitId}","${t.petugas}","${(t.keperluan || '').replace(/"/g, '""')}","${t.statusPersetujuan}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Rekap_Barang_Keluar_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalVolumeKeluar = transaksiList
    .filter(t => t.statusPersetujuan === 'Disetujui')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

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
                KONFIRMASI PEMBERSIHAN BARANG KELUAR
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
                Apakah Anda yakin ingin menghapus <strong className="text-red-600 font-bold">{selectedIds.length} transaksi barang keluar</strong> yang dipilih?
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

      {/* Confirmation Popup Modal */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                KONFIRMASI DISTRIBUSI BARANG KELUAR
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
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>PERHATIAN:</strong> Konfirmasi ini akan diajukan ke sistem. Stok barang persediaan akan disesuaikan secara otomatis.
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Nama Item:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedItem.nama} ({selectedItem.id})</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Volume Keluar:</span>
                  <span className="col-span-2 font-bold text-red-600 text-sm">-{jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Sisa Stok Nanti:</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {selectedItem.stokSekarang - jumlah} {selectedItem.satuan}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Unit Penerima:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedUnitId}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Petugas:</span>
                  <span className="col-span-2 font-medium text-gray-800">{petugas}</span>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <span className="text-gray-500 font-semibold">Keperluan:</span>
                  <span className="col-span-2 text-gray-900 italic font-medium">"{keperluan}"</span>
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Ya, Konfirmasi Distribusi
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
            handleBarangChange(item.id);
          }
        }}
        barangList={barangList}
        kategoriList={kategoriList}
      />

      {/* Main Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ArrowUpRight className="w-64 h-64 text-red-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-red-500/20 border border-red-400/30 text-red-300 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Mutasi Keluar & Distribusi
              </span>
              <span className="text-slate-400 text-xs">SIP-BMN Digital Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Pengeluaran & Distribusi Barang Keluar
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
              Ajukan permohonan pengeluaran BMN untuk unit penerima, proses otorisasi kelayakan stok, dan kelola riwayat distribusi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-red-400/30"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Barang
            </button>
          </div>
        </div>

        {/* Stats Metrics Sub-bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Disetujui / Selesai</span>
              <span className="text-base font-bold text-white">{finalizedRequests.length} Mutasi</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Menunggu Persetujuan</span>
              <span className="text-base font-bold text-white">{pendingRequests.length} Permohonan</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Volume Keluar</span>
              <span className="text-base font-bold text-white">-{totalVolumeKeluar} Item</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Controls for View Switching */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <LayoutGrid className="w-4 h-4 text-red-600" />
          <span>Tampilan Tata Letak:</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'split' 
                ? 'bg-white text-red-700 font-bold shadow-sm' 
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
                ? 'bg-white text-red-700 font-bold shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Form Input
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'history' 
                ? 'bg-white text-red-700 font-bold shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat ({transaksiList.length})
          </button>
        </div>
      </div>

      {/* Pending Approvals Bar for Approvers */}
      {isApprover && pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                Perlu Otorisasi Anda: {pendingRequests.length} Permohonan Pengeluaran Barang
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md">
              Akses Kasubag / Admin
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {pendingRequests.map((p, idx) => (
              <div key={`${p.id}_${idx}`} className="bg-white p-3.5 border border-amber-200/80 rounded-xl shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900 block">{p.namaBarang}</span>
                    <span className="text-[10px] text-gray-500 font-mono">ID: {p.barangId}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-lg text-xs">
                    -{p.jumlah} Item
                  </span>
                </div>

                <div className="text-[11px] text-gray-600 space-y-0.5 border-t border-slate-100 pt-2">
                  <p><strong className="text-gray-700">Unit:</strong> {p.unitId}</p>
                  <p><strong className="text-gray-700">Tujuan:</strong> "{p.keperluan}"</p>
                  <p><strong className="text-gray-700">Petugas:</strong> {p.petugas}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onApproveRejectTransaksi(p.id, 'Disetujui')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                  </button>
                  <button
                    onClick={() => onApproveRejectTransaksi(p.id, 'Ditolak')}
                    className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  Form Input Pengeluaran BMN
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Ajukan mutasi barang keluar untuk unit kerja pemohon</p>
              </div>

              <span className="text-[10px] font-mono px-2 py-1 bg-red-50 text-red-700 font-bold border border-red-200 rounded-lg">
                DISTRIBUSI
              </span>
            </div>

            <div className="p-5">
              {isReadOnly ? (
                <div className="p-6 bg-slate-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-bold">Akses Penonton (Viewer)</p>
                  <p>Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk mengajukan mutasi keluar.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">

                  {/* STEP 1: KATEGORI & BARANG */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-3">
                    {/* 1. Kategori Selection with Live Search */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-gray-700 font-bold flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-red-600" />
                          1. Pilih Kategori Barang *
                        </label>
                        {selectedCategoryObj && (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md font-mono">
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
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                        />
                      </div>

                      <select
                        required
                        value={selectedKategoriId}
                        onChange={e => handleKategoriChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-bold text-gray-900"
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
                          <Package className="w-3.5 h-3.5 text-red-600" />
                          2. Pilih Item Barang Keluar *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsScannerOpen(true)}
                          className="text-[10px] text-red-700 hover:underline flex items-center gap-1 font-bold"
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
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                        />
                      </div>

                      <select
                        required
                        value={selectedBarangId}
                        onChange={e => handleBarangChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-bold text-gray-900"
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
                      <div className="p-3 bg-white border border-red-100 rounded-xl text-[11px] space-y-2 shadow-2xs">
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Stok Tersedia:</span>
                            <span className="font-bold text-gray-900 text-xs">
                              {selectedItem.stokSekarang} {selectedItem.satuan}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Lokasi Rak:</span>
                            <span className="font-bold text-slate-800 text-xs">{selectedItem.lokasiRak || 'Gudang Utama'}</span>
                          </div>
                        </div>

                        {selectedItem.stokSekarang < selectedItem.stokMin && (
                          <div className="p-2 bg-red-50 text-red-700 text-[10px] rounded-lg border border-red-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            Peringatan: Stok berada di bawah batas minimum ({selectedItem.stokMin} {selectedItem.satuan})
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* STEP 2: VOLUME & RECEIVER */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-gray-700 font-bold flex items-center gap-1">
                        3. Kuantitas Volume Distribusi *
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah - 5)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah - 1)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={1}
                            required
                            value={jumlah}
                            onChange={e => handleJumlahChange(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 text-center font-bold text-red-700 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah + 1)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah + 5)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200"
                          >
                            +5
                          </button>
                        </div>

                        <span className="px-3 py-2 bg-slate-100 border border-gray-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center">
                          {selectedItem?.satuan || 'Pcs'}
                        </span>
                      </div>

                      {validationError && (
                        <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {validationError}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Unit Pemohon */}
                      <div className="space-y-1">
                        <label className="block text-gray-700 font-bold flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          4. Unit Pemohon Penerima *
                        </label>
                        <select
                          required
                          value={selectedUnitId}
                          onChange={e => setSelectedUnitId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                        >
                          {unitList.map(u => (
                            <option key={u.id} value={u.nama}>
                              {u.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Officer */}
                      <div className="space-y-1">
                        <label className="block text-gray-700 font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          5. Petugas Penyerah BMN *
                        </label>
                        <select
                          required
                          value={petugas}
                          onChange={e => setPetugas(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
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

                  {/* STEP 3: PURPOSE & NOTES */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-gray-700 font-bold">6. Keperluan Penggunaan / Alasan *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Cetak raport / Kegiatan evaluasi bulanan..."
                        value={keperluan}
                        onChange={e => setKeperluan(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-gray-700 font-bold">7. Catatan Pengeluaran</label>
                      <textarea
                        rows={2}
                        placeholder="Catatan kondisi pengiriman atau nomor nota surat keluar..."
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!!validationError || !selectedBarangId}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    Proses Distribusi Barang <ArrowUpRight className="w-4 h-4" />
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
                  <History className="w-4 h-4 text-red-600" />
                  Riwayat Distribusi Barang Keluar
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Menampilkan {filteredFinalizedRequests.length} transaksi selesai
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
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
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
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
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
                          checked={selectedIds.length === filteredFinalizedRequests.length && filteredFinalizedRequests.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                        />
                      </th>
                    )}
                    <th className="p-3">ID Transaksi / Waktu</th>
                    <th className="p-3">Item Barang</th>
                    <th className="p-3 text-center">Volume</th>
                    <th className="p-3">Unit Penerima & Keperluan</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                  {filteredFinalizedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-gray-400">
                        <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        Belum ada riwayat transaksi barang keluar yang selesai / cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredFinalizedRequests.map((t, idx) => (
                      <tr key={`${t.id}_${idx}`} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(t.id) ? 'bg-red-50/40' : ''}`}>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={() => handleToggleSelectRow(t.id)}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
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
                            {new Date(t.tanggal).toLocaleDateString('id-ID')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{t.namaBarang}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {t.barangId}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-bold rounded-lg text-xs">
                            -{t.jumlah}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-800 font-bold block">{t.unitId}</span>
                          <span className="text-[9px] text-gray-500 block mt-0.5 truncate max-w-[140px]">Tujuan: {t.keperluan}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.statusPersetujuan === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {t.statusPersetujuan === 'Disetujui' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Disetujui
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Ditolak
                              </>
                            )}
                          </span>
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
