/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowDownLeft, Check, X, ShieldAlert, Clock, CalendarClock,
  Truck, FileSpreadsheet, QrCode, Package, History, Download, FileUp, 
  FileText, LayoutGrid, CheckCircle2, Copy, UserCheck, AlertCircle, 
  Sparkles, Trash2, ShieldCheck, Lock, Info, PlusCircle
} from 'lucide-react';
import { Barang, Kategori, Supplier, BarangMasuk, Pegawai, Unit } from '../types';
import QRScannerModal from './QRScannerModal';
import ExportConfirmModal from './ExportConfirmModal';
import BarangSearchPicker from './BarangSearchPicker';

interface TransaksiMasukViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  supplierList: Supplier[];
  transaksiList: BarangMasuk[];
  onProcessTransaksi: (
    t: Omit<BarangMasuk, 'id' | 'tanggal'> & { tanggal?: string; isSusulan?: boolean; keteranganSusulan?: string; waktuInputSistem?: string },
    langsungKeluar?: { unitId: string; keperluan: string; petugas: string; catatan: string; tanggal?: string }
  ) => void;
  onDeleteTransaksi?: (ids: string[]) => void;
  currentUserRole: string;
  quickAddBarangId?: string;
  clearQuickAdd?: () => void;
  pegawaiList: Pegawai[];
  unitList: Unit[];
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
  unitList = []
}: TransaksiMasukViewProps) {
  // 3-Layout System: 'form' (Real-time input), 'susulan' (Backdated retroaktif input - Admin only), 'history' (Riwayat & Rekap)
  const [viewMode, setViewMode] = useState<'form' | 'susulan' | 'history'>('form');

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'realtime' | 'susulan'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const isAdmin = currentUserRole === 'Administrator';
  const isReadOnly = currentUserRole === 'Viewer';

  // Form Fields
  const [selectedBarangId, setSelectedBarangId] = useState<string>(() => {
    if (quickAddBarangId) return quickAddBarangId;
    return barangList[0]?.id || '';
  });

  const [jumlah, setJumlah] = useState<number>(1);
  const [selectedSupplier, setSelectedSupplier] = useState(supplierList?.[0]?.nama || 'PT. Mitra Edukasi');
  const [petugas, setPetugas] = useState(() => pegawaiList?.[0]?.nama || 'Roni Setiawan');
  const [catatan, setCatatan] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fitur Langsung Distribusikan (Masuk & Keluar sekaligus)
  const [isLangsungKeluar, setIsLangsungKeluar] = useState(false);
  const [lkUnitId, setLkUnitId] = useState(unitList?.[0]?.nama || 'Subbagian Umum');
  const [lkKeperluan, setLkKeperluan] = useState('');
  const [lkCatatan, setLkCatatan] = useState('');

  // Retroaktif / Data Susulan States (Khusus Administrator)
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentHourMinute = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const [susulanDate, setSusulanDate] = useState<string>(todayStr);
  const [susulanTime, setSusulanTime] = useState<string>(currentHourMinute);
  const [susulanAlasan, setSusulanAlasan] = useState<string>('');
  const [susulanNoDokumenManual, setSusulanNoDokumenManual] = useState<string>('');
  const [susulanError, setSusulanError] = useState<string>('');

  const susulanPresets = [
    'Penerimaan fisik barang di luar jam kantor / hari libur',
    'Barang datang saat penerimaan logistik mendesak di lapangan',
    'Pencatatan rekapitulasi dari buku register manual BMN',
    'Faktur dan surat jalan fisik baru diserahkan oleh kurir/vendor'
  ];

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
        setSelectedBarangId(matched.id);
        setViewMode('form');
      }
    }
  }, [quickAddBarangId, barangList]);

  const selectedItem = barangList.find(b => b.id === selectedBarangId);

  const handleBarangChange = (id: string) => {
    setSelectedBarangId(id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!selectedBarangId || jumlah <= 0) return;

    if (viewMode === 'susulan') {
      if (!isAdmin) {
        setSusulanError('Hanya akun Administrator yang berhak menginput data susulan!');
        return;
      }
      if (!susulanDate) {
        setSusulanError('Tanggal fisik transaksi wajib diisi.');
        return;
      }
      if (!susulanAlasan.trim()) {
        setSusulanError('Alasan / keterangan dasar pencatatan data susulan wajib diisi untuk rekam audit.');
        return;
      }
      setSusulanError('');
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    const isSusulanMode = viewMode === 'susulan';
    let transactionTimestamp: string;

    if (isSusulanMode) {
      const timeVal = susulanTime || '12:00';
      const parsedDate = new Date(`${susulanDate}T${timeVal}:00`);
      transactionTimestamp = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
    } else {
      transactionTimestamp = new Date().toISOString();
    }

    const payloadCatatan = isSusulanMode
      ? `[DATA SUSULAN] ${susulanNoDokumenManual ? `(No. Dok: ${susulanNoDokumenManual}) ` : ''}${catatan}`.trim()
      : catatan;

    onProcessTransaksi(
      {
        barangId: selectedBarangId,
        namaBarang: selectedItem?.nama || '',
        jumlah,
        supplier: selectedSupplier,
        petugas,
        catatan: payloadCatatan,
        fileDokumen: uploadedFile || undefined,
        fileData: fileDataUrl || undefined,
        tanggal: transactionTimestamp,
        isSusulan: isSusulanMode,
        keteranganSusulan: isSusulanMode ? susulanAlasan : undefined,
        waktuInputSistem: new Date().toISOString()
      },
      isLangsungKeluar
        ? {
            unitId: lkUnitId,
            keperluan: lkKeperluan,
            petugas,
            catatan: isSusulanMode ? `[DISTRIBUSI SUSULAN] ${lkCatatan}`.trim() : lkCatatan,
            tanggal: transactionTimestamp
          }
        : undefined
    );

    // Reset Form
    setJumlah(1);
    setCatatan('');
    setUploadedFile(null);
    setFileDataUrl(null);
    setIsLangsungKeluar(false);
    setLkKeperluan('');
    setLkCatatan('');
    setShowConfirmModal(false);
    if (isSusulanMode) {
      setSusulanAlasan('');
      setSusulanNoDokumenManual('');
    }
    if (clearQuickAdd) clearQuickAdd();
  };

  // Available month options
  const availableMonths = Array.from(
    new Set(
      transaksiList
        .map(t => (t.tanggal ? t.tanggal.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  // Filter history list by search term, selected month, and filter type
  const filteredTransaksiList = transaksiList.filter(t => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.namaBarang.toLowerCase().includes(q) ||
      t.supplier.toLowerCase().includes(q) ||
      t.petugas.toLowerCase().includes(q) ||
      (t.catatan && t.catatan.toLowerCase().includes(q)) ||
      (t.keteranganSusulan && t.keteranganSusulan.toLowerCase().includes(q));

    const matchesMonth =
      selectedMonth === 'all' ? true : t.tanggal && t.tanggal.startsWith(selectedMonth);

    const matchesType =
      selectedFilterType === 'all'
        ? true
        : selectedFilterType === 'susulan'
        ? t.isSusulan === true
        : t.isSusulan !== true;

    return matchesSearch && matchesMonth && matchesType;
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

  const executeExportCSV = (data: BarangMasuk[], summaryText: string) => {
    const headers = 'ID Transaksi,Tipe Catatan,Tanggal Fisik,Waktu Input Sistem,Kode Barang,Nama Barang,Volume,Supplier,Petugas,Alasan Susulan,Catatan\n';
    const rows = data
      .map(
        t =>
          `"${t.id}","${t.isSusulan ? 'DATA SUSULAN' : 'REAL-TIME'}","${new Date(t.tanggal).toLocaleString('id-ID')}","${t.waktuInputSistem ? new Date(t.waktuInputSistem).toLocaleString('id-ID') : '-'}","${t.barangId}","${
            t.namaBarang
          }",+${t.jumlah},"${t.supplier}","${t.petugas}","${(t.keteranganSusulan || '').replace(/"/g, '""')}","${(t.catatan || '').replace(/"/g, '""')}"`
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
  const totalTransaksiSusulan = transaksiList.filter(t => t.isSusulan).length;

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
                ⚠️ <strong>PERHATIAN (ADMIN ONLY):</strong> Pembersihan transaksi ini akan diperbarui ke database secara permanen. Disarankan untuk mengunduh rekap CSV terlebih dahulu.
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

      {/* Confirmation Popup Modal for Inbound Processing */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            {/* Header */}
            <div className={`p-4 text-white flex items-center justify-between ${viewMode === 'susulan' ? 'bg-amber-800' : 'bg-slate-900'}`}>
              <span className="text-xs font-bold flex items-center gap-2">
                {viewMode === 'susulan' ? (
                  <>
                    <CalendarClock className="w-4 h-4 text-amber-300" />
                    KONFIRMASI PENERIMAAN BARANG (DATA SUSULAN)
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    KONFIRMASI PENERIMAAN BARANG MASUK
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-black/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-slate-700">
              {viewMode === 'susulan' ? (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> PENCATATAN RETROAKTIF (DATA SUSULAN)
                  </div>
                  <p>
                    Transaksi ini dicatat mundur (backdated) sesuai waktu fisik penyerahan barang dan telah diotorisasi oleh Administrator.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                  <strong>PERHATIAN:</strong> Konfirmasi ini akan menambah stok persediaan BMN secara instan ke sistem.
                </div>
              )}

              <div className="space-y-2.5 bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                {viewMode === 'susulan' && (
                  <>
                    <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                      <span className="text-gray-500 font-semibold">Waktu Fisik:</span>
                      <span className="col-span-2 font-bold text-amber-900">
                        {susulanDate} pukul {susulanTime} WIB
                      </span>
                    </div>
                    <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                      <span className="text-gray-500 font-semibold">Alasan Susulan:</span>
                      <span className="col-span-2 font-medium text-amber-900 italic">
                        "{susulanAlasan}"
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Nama Item:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedItem.nama} ({selectedItem.id})</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Volume Masuk:</span>
                  <span className="col-span-2 font-bold text-emerald-700 text-sm">+{jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Total Stok Nanti:</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {selectedItem.stokSekarang + jumlah} {selectedItem.satuan}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Penyedia / Vendor:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedSupplier}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Petugas Penerima:</span>
                  <span className="col-span-2 font-medium text-gray-800">{petugas}</span>
                </div>
                {isLangsungKeluar && (
                  <div className="grid grid-cols-3 py-1 bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                    <span className="text-blue-700 font-bold">Langsung Distribusi:</span>
                    <span className="col-span-2 text-blue-900 font-medium">
                      Unit: {lkUnitId} | Keperluan: "{lkKeperluan}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal / Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className={`px-4 py-2 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 ${
                  viewMode === 'susulan' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" /> Ya, Simpan Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code, item) => {
          if (item) {
            handleBarangChange(item.id);
          }
        }}
        barangList={barangList}
        kategoriList={kategoriList}
      />

      {/* Main Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ArrowDownLeft className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Mutasi Masuk & Pengadaan
              </span>
              <span className="text-slate-400 text-xs">SIP-BMN Digital Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Penerimaan & Pengadaan Barang Masuk
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
              Catat penerimaan BMN dari penyedia, kelola faktur surat jalan fisik, input data susulan retroaktif, dan pantau logbook mutasi.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Transaksi</span>
              <span className="text-base font-bold text-white">{transaksiList.length} Mutasi</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Volume Diterima</span>
              <span className="text-base font-bold text-white">+{totalVolumeMasuk} Item</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Data Susulan</span>
              <span className="text-base font-bold text-white">{totalTransaksiSusulan} Transaksi</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Supplier Aktif</span>
              <span className="text-base font-bold text-white">{supplierList.length} Vendor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Controls for 3 Distinct Layout Views */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 px-1 sm:px-0">
          <LayoutGrid className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pilih Tata Letak Layar:</span>
        </div>

        <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          {/* TAB 1: FORM INPUT REALTIME */}
          <button
            onClick={() => setViewMode('form')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center min-w-0 ${
              viewMode === 'form' 
                ? 'bg-white text-emerald-700 font-bold shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Form Input (Langsung)</span>
            <span className="sm:hidden text-[11px] font-bold truncate">Input Baru</span>
          </button>

          {/* TAB 2: FORM INPUT DATA SUSULAN (ADMIN ONLY) */}
          <button
            onClick={() => setViewMode('susulan')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center min-w-0 ${
              viewMode === 'susulan' 
                ? 'bg-amber-600 text-white font-bold shadow-xs' 
                : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Input Data Susulan</span>
            <span className="sm:hidden text-[11px] font-bold truncate">Susulan</span>
            {!isAdmin ? (
              <span className="text-[9px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 bg-slate-200 text-slate-700 rounded flex items-center gap-0.5 font-bold shrink-0">
                <Lock className="w-2.5 h-2.5 hidden sm:inline" /> Admin
              </span>
            ) : (
              <span className={`text-[9px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-bold shrink-0 ${
                viewMode === 'susulan' ? 'bg-amber-700 text-amber-100' : 'bg-amber-200/80 text-amber-900'
              }`}>
                Admin
              </span>
            )}
          </button>

          {/* TAB 3: RIWAYAT */}
          <button
            onClick={() => setViewMode('history')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center min-w-0 ${
              viewMode === 'history' 
                ? 'bg-white text-emerald-700 font-bold shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Riwayat Mutasi ({transaksiList.length})</span>
            <span className="sm:hidden text-[11px] font-bold truncate">Riwayat ({transaksiList.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYOUT 1: STANDARD REAL-TIME FORM INPUT                                  */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="max-w-4xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-50 border-b border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Form Penerimaan Barang Masuk (Pencatatan Real-Time)
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Gunakan form ini untuk mencatat penerimaan BMN yang terjadi saat ini secara langsung. Tanggal dan waktu sistem otomatis dicatat.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WAKTU AKTIF SISTEM
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {isReadOnly ? (
              <div className="p-8 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-center text-xs text-amber-800 space-y-2">
                <ShieldAlert className="w-10 h-10 mx-auto text-amber-500" />
                <p className="font-bold text-sm">Akses Terbatas (Viewer)</p>
                <p>Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk melakukan mutasi barang.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium text-gray-700">
                {/* 1. SELEKSI BARANG & SEARCH PICKER */}
                <div>
                  <label className="block text-gray-900 font-bold mb-2 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Pilih Item Barang Persediaan BMN *
                  </label>
                  <BarangSearchPicker
                    barangList={barangList}
                    kategoriList={kategoriList}
                    selectedBarangId={selectedBarangId}
                    onSelectBarang={(b) => handleBarangChange(b.id)}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    mode="masuk"
                  />
                </div>

                {/* 2. KUANTITAS & SATUAN */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    Kuantitas Volume Masuk & Satuan *
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => setJumlah(Math.max(1, jumlah - 5))}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={1}
                        required
                        value={jumlah}
                        onChange={e => setJumlah(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 text-center font-bold text-emerald-700 text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setJumlah(jumlah + 1)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setJumlah(jumlah + 5)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>

                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-1.5">
                      <span>Satuan Barang:</span>
                      <span className="text-emerald-700 uppercase font-mono">{selectedItem?.satuan || 'Pcs'}</span>
                    </div>

                    {selectedItem && (
                      <span className="text-gray-500 text-[11px]">
                        Stok Saat Ini: <strong>{selectedItem.stokSekarang} {selectedItem.satuan}</strong> → Menjadi: <strong className="text-emerald-700 font-bold">{selectedItem.stokSekarang + jumlah} {selectedItem.satuan}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. SUPPLIER & PETUGAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                      <Truck className="w-3.5 h-3.5 text-gray-500" />
                      Supplier Penyedia / Sumber Pengadaan *
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={e => setSelectedSupplier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
                    >
                      {supplierList.map(s => (
                        <option key={s.id} value={s.nama}>
                          {s.nama} {s.kontak ? `(${s.kontak})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                      <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                      Petugas Penerima BMN *
                    </label>
                    <select
                      required
                      value={petugas}
                      onChange={e => setPetugas(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
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

                {/* 4. UPLOAD SURAT JALAN / FAKTUR */}
                <div className="space-y-1.5">
                  <label className="block text-gray-900 font-bold text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                      <FileUp className="w-3.5 h-3.5 text-gray-500" />
                      Unggah Berkas Faktur / Surat Jalan (Drive Storage)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Opsional</span>
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
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
                      <FileUp className="w-6 h-6 mx-auto text-emerald-600" />
                      <div className="text-xs text-gray-700 font-bold">
                        {uploadedFile ? (
                          <span className="text-emerald-700 flex items-center justify-center gap-1 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {uploadedFile}
                          </span>
                        ) : (
                          'Tarik file surat jalan di sini, atau klik untuk memilih'
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">Mendukung PDF, JPG, PNG (Maksimal 10MB)</p>
                    </label>
                  </div>
                </div>

                {/* 5. CATATAN PENERIMAAN */}
                <div className="space-y-1.5">
                  <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">6</span>
                    Catatan Penerimaan / Nomor BAP (Berita Acara)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Nomor BAP Penerimaan BMN / No. Faktur Pembelian..."
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
                  />
                </div>

                {/* 6. FITUR LANGSUNG DISTRIBUSI */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isLangsungKeluar}
                      onChange={e => setIsLangsungKeluar(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Langsung Distribusikan (Masuk & Keluar Sekaligus)</span>
                      <span className="text-[11px] text-slate-500 font-normal">Centang jika barang ini merupakan pengadaan khusus untuk langsung diserahkan ke unit pemohon.</span>
                    </div>
                  </label>
                  
                  {isLangsungKeluar && (
                    <div className="mt-3 p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-slate-700 font-bold">Unit Pemohon Penerima *</label>
                          <select
                            required={isLangsungKeluar}
                            value={lkUnitId}
                            onChange={e => setLkUnitId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                          >
                            {unitList?.map(u => (
                              <option key={u.id} value={u.nama}>{u.nama}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-700 font-bold">Keperluan / Nama Acara *</label>
                          <input
                            type="text"
                            required={isLangsungKeluar}
                            value={lkKeperluan}
                            onChange={e => setLkKeperluan(e.target.value)}
                            placeholder="Contoh: Kegiatan Workshop BMN..."
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-700 font-bold">Catatan Distribusi Keluar (Opsional)</label>
                        <input
                          type="text"
                          value={lkCatatan}
                          onChange={e => setLkCatatan(e.target.value)}
                          placeholder="Catatan penyerahan..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    isLangsungKeluar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  {isLangsungKeluar ? 'Simpan Penerimaan & Langsung Distribusikan' : 'Simpan Transaksi Barang Masuk'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT 2: INPUT DATA SUSULAN (RETROAKTIF) - KHUSUS ADMINISTRATOR          */}
      {/* ========================================================================= */}
      {viewMode === 'susulan' && (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-200 space-y-4">
          {!isAdmin ? (
            /* NON-ADMIN SECURITY BARRIER */
            <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-bold text-gray-900 text-base">Otoritas Akses Khusus Administrator</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Fitur <strong>Input Data Susulan (Manipulasi Tanggal & Waktu Retroaktif)</strong> hanya dapat diakses oleh akun dengan role <strong>Administrator</strong>. Pembatasan ini diterapkan guna menjamin integritas rekam jejak audit BMN BPMP Provinsi Sumatera Selatan.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setViewMode('form')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Beralih ke Form Input Real-Time
                </button>
              </div>
            </div>
          ) : (
            /* ADMIN BACKDATED FORM */
            <div className="bg-white border border-amber-300 rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-700 text-amber-100 rounded-lg">
                      <CalendarClock className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-white text-base">
                      Form Input Data Susulan (Pencatatan Retroaktif Penerimaan)
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-200 mt-1">
                    Gunakan fitur ini ketika fisik barang BMN telah diterima sebelumnya di luar sistem (misal: penyerahan langsung di lapangan/libur) dan baru sempat diinput ke website saat ini.
                  </p>
                </div>

                <span className="text-[10px] font-mono px-3 py-1 bg-amber-950/80 text-amber-300 font-bold border border-amber-700 rounded-lg flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> MODE ADMINISTRATOR
                </span>
              </div>

              <div className="p-5 sm:p-7 space-y-6">
                {/* Information Audit Box */}
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Info className="w-4 h-4 text-amber-700" /> Ketentuan Pencatatan Retroaktif / Susulan
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Sistem akan menyimpan tanggal transaksi fisik yang Anda tetapkan sebagai waktu mutasi barang, namun tetap mendokumentasikan waktu asli penginputan sistem (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">waktuInputSistem</code>) untuk keperluan transparansi audit BMN.
                  </p>
                </div>

                {susulanError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {susulanError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium text-gray-700">
                  {/* SEKSI A: PENGATURAN TANGGAL & WAKTU FISIK RETROAKTIF */}
                  <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-4">
                    <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      1. Manipulasi Waktu Transaksi Fisik (Tanggal, Jam, Menit)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-gray-900 font-bold text-xs">
                          Tanggal Fisik Barang Diterima *
                        </label>
                        <input
                          type="date"
                          max={todayStr}
                          required
                          value={susulanDate}
                          onChange={e => setSusulanDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs font-semibold text-gray-900"
                        />
                        <span className="text-[10px] text-gray-500 block">Pilih tanggal barang fisik diserahkan/diterima oleh petugas.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-gray-900 font-bold text-xs">
                          Jam & Menit Fisik Diterima *
                        </label>
                        <input
                          type="time"
                          required
                          value={susulanTime}
                          onChange={e => setSusulanTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs font-semibold text-gray-900 font-mono"
                        />
                        <span className="text-[10px] text-gray-500 block">Format 24 Jam (Jam:Menit saat barang fisik tiba).</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <label className="block text-gray-900 font-bold text-xs">
                        Alasan / Dasar Pencatatan Susulan * (Rekam Jejak Audit)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Barang fisik tiba hari Minggu saat libur, baru diinput pada hari kerja..."
                        value={susulanAlasan}
                        onChange={e => setSusulanAlasan(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      />

                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-amber-800 font-semibold self-center">Pilihan Cepat:</span>
                        {susulanPresets.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setSusulanAlasan(preset)}
                            className="px-2.5 py-1 bg-amber-100/70 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] border border-amber-300 transition-colors cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs">
                        Nomor Dokumen / Logbook Manual (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: No. Register Logbook BMN: REG-2026/04/01"
                        value={susulanNoDokumenManual}
                        onChange={e => setSusulanNoDokumenManual(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* SEKSI B: DETAIL ITEM BARANG */}
                  <div>
                    <label className="block text-gray-900 font-bold mb-2 text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                      Pilih Item Barang yang Telah Diterima *
                    </label>
                    <BarangSearchPicker
                      barangList={barangList}
                      kategoriList={kategoriList}
                      selectedBarangId={selectedBarangId}
                      onSelectBarang={(b) => handleBarangChange(b.id)}
                      onOpenScanner={() => setIsScannerOpen(true)}
                      mode="masuk"
                    />
                  </div>

                  {/* SEKSI C: KUANTITAS & SUPPLIER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <label className="block text-gray-900 font-bold text-xs">
                        Kuantitas Volume Masuk *
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={1}
                            required
                            value={jumlah}
                            onChange={e => setJumlah(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-2 text-center font-bold text-amber-800 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setJumlah(jumlah + 1)}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                          >
                            +1
                          </button>
                        </div>
                        <span className="px-3 py-2 bg-slate-100 border border-gray-200 font-bold rounded-xl text-xs">
                          {selectedItem?.satuan || 'Pcs'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-gray-500" /> Supplier Penyedia *
                      </label>
                      <select
                        value={selectedSupplier}
                        onChange={e => setSelectedSupplier(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      >
                        {supplierList.map(s => (
                          <option key={s.id} value={s.nama}>
                            {s.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SEKSI D: PETUGAS & CATATAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-gray-500" /> Petugas yang Menerima BMN *
                      </label>
                      <select
                        required
                        value={petugas}
                        onChange={e => setPetugas(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      >
                        {pegawaiList?.map(p => (
                          <option key={p.id} value={p.nama}>{p.nama} ({p.jabatan})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs">Catatan Tambahan</label>
                      <input
                        type="text"
                        placeholder="Keterangan kondisi fisik barang..."
                        value={catatan}
                        onChange={e => setCatatan(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* LANGSUNG DISTRIBUSI CHECKBOX */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2.5 cursor-pointer bg-amber-50/50 border border-amber-200 p-3 rounded-xl">
                      <input
                        type="checkbox"
                        checked={isLangsungKeluar}
                        onChange={e => setIsLangsungKeluar(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-700 focus:ring-amber-700 cursor-pointer"
                      />
                      <span className="font-bold text-amber-950 text-xs">
                        Catat Pengeluaran Langsung Sekaligus (Barang Langsung Diserahkan ke Unit pada Tanggal Tersebut)
                      </span>
                    </label>

                    {isLangsungKeluar && (
                      <div className="mt-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-slate-700 font-bold">Unit Pemohon Penerima *</label>
                            <select
                              required={isLangsungKeluar}
                              value={lkUnitId}
                              onChange={e => setLkUnitId(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                            >
                              {unitList?.map(u => (
                                <option key={u.id} value={u.nama}>{u.nama}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-700 font-bold">Keperluan / Acara *</label>
                            <input
                              type="text"
                              required={isLangsungKeluar}
                              value={lkKeperluan}
                              onChange={e => setLkKeperluan(e.target.value)}
                              placeholder="Contoh: Digunakan untuk sosialisasi..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <CalendarClock className="w-4 h-4" /> Simpan Data Susulan Penerimaan BMN
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT 3: TRANSACTIONS HISTORY TABLE                                     */}
      {/* ========================================================================= */}
      {viewMode === 'history' && (
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                Riwayat & Logbook Mutasi Barang Masuk
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Menampilkan {filteredTransaksiList.length} dari total {transaksiList.length} rekam jejak transaksi
              </p>
            </div>

            {/* Filter & Export Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && selectedIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedIds.length})
                </button>
              )}

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" /> Export CSV
              </button>

              {/* Type Filter */}
              <select
                value={selectedFilterType}
                onChange={e => setSelectedFilterType(e.target.value as any)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="all">🔍 Semua Jenis Transaksi</option>
                <option value="realtime">🟢 Real-Time Saja</option>
                <option value="susulan">⏱️ Data Susulan Saja</option>
              </select>

              {/* Month Filter */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari ID, Barang, Supplier..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
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
                    <th className="p-3.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredTransaksiList.length && filteredTransaksiList.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                    </th>
                  )}
                  <th className="p-3.5">ID & Waktu Transaksi</th>
                  <th className="p-3.5">Item Barang</th>
                  <th className="p-3.5 text-center">Volume</th>
                  <th className="p-3.5">Supplier & Petugas</th>
                  <th className="p-3.5">Tipe & Catatan Audit</th>
                  <th className="p-3.5 text-right">Faktur / Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                {filteredTransaksiList.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-10 text-center text-gray-400">
                      <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      Belum ada transaksi barang masuk yang tercatat / cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransaksiList.map((t, idx) => (
                    <tr key={`${t.id}_${idx}`} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(t.id) ? 'bg-emerald-50/40' : ''}`}>
                      {isAdmin && (
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => handleToggleSelectRow(t.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                        </td>
                      )}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900 text-xs">{t.id}</span>
                          <button
                            onClick={() => copyToClipboard(t.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                            title="Salin Kode ID"
                          >
                            {copiedId === t.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-600 font-medium block mt-0.5">
                          {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-gray-900 block">{t.namaBarang}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {t.barangId}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-xs font-mono">
                          +{t.jumlah}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-gray-800 font-semibold block truncate max-w-[150px]">{t.supplier}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5 truncate max-w-[150px]">Oleh: {t.petugas}</span>
                      </td>
                      <td className="p-3.5">
                        {t.isSusulan ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px]">
                              <Clock className="w-3 h-3 text-amber-700" /> Data Susulan
                            </span>
                            {t.keteranganSusulan && (
                              <p className="text-[10px] text-amber-900 italic max-w-[200px] leading-tight">
                                "{t.keteranganSusulan}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {t.catatan || 'Penerimaan standar'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
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
                            <span className="truncate max-w-[90px]">{t.fileDokumen}</span>
                            <Download className="w-3 h-3 text-red-500 shrink-0" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 font-mono">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[90px]">{t.fileDokumen || '-'}</span>
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

      {/* Export Confirm Modal */}
      <ExportConfirmModal<BarangMasuk>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Konfirmasi Ekspor Data Barang Masuk"
        description="Pilih periode bulan atau hari transaksi barang masuk yang akan diunduh"
        dataList={filteredTransaksiList}
        getDateFn={item => item.tanggal || ''}
        onConfirm={(filteredData, format, summaryText) => {
          executeExportCSV(filteredData, summaryText);
        }}
      />
    </div>
  );
}
