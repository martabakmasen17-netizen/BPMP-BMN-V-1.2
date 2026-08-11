/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowUpRight, Check, X, ShieldAlert, Clock, CalendarClock,
  Building, FileSpreadsheet, QrCode, Package, History, 
  LayoutGrid, CheckCircle2, XCircle, Copy, UserCheck, AlertCircle, 
  Sparkles, Trash2, ShieldCheck, Lock, Info, PlusCircle
} from 'lucide-react';
import { Barang, Kategori, Unit, BarangKeluar, Pegawai } from '../types';
import QRScannerModal from './QRScannerModal';
import ExportConfirmModal from './ExportConfirmModal';
import BarangSearchPicker from './BarangSearchPicker';

export interface CartItemKeluar {
  cartId: string;
  barangId: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  stokSisa: number;
}

interface TransaksiKeluarViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  unitList: Unit[];
  transaksiList: BarangKeluar[];
  onProcessTransaksi: (
    t: Omit<BarangKeluar, 'id' | 'tanggal' | 'statusPersetujuan'> & {
      tanggal?: string;
      isSusulan?: boolean;
      keteranganSusulan?: string;
      waktuInputSistem?: string;
    }
  ) => void;
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
  // 3-Layout System: 'form' (Real-time input), 'susulan' (Backdated retroaktif input - Admin only), 'history' (Riwayat & Rekap)
  const [viewMode, setViewMode] = useState<'form' | 'susulan' | 'history'>('form');

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'realtime' | 'susulan'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const isAdmin = currentUserRole === 'Administrator';
  const isReadOnly = currentUserRole === 'Viewer';
  const isApprover = currentUserRole === 'Kepala Subbagian' || currentUserRole === 'Administrator';

  // Cart State
  const [cart, setCart] = useState<CartItemKeluar[]>([]);

  // Form Fields
  const [selectedBarangId, setSelectedBarangId] = useState<string>(() => {
    if (quickAddBarangId) return quickAddBarangId;
    return barangList[0]?.id || '';
  });

  const [jumlah, setJumlah] = useState<number>(1);
  const [selectedUnitId, setSelectedUnitId] = useState(unitList?.[0]?.nama || 'Subbagian Umum');
  const [petugas, setPetugas] = useState(() => pegawaiList?.[0]?.nama || 'Roni Setiawan');
  const [keperluan, setKeperluan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Retroaktif / Data Susulan States (Khusus Administrator)
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentHourMinute = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const [susulanDate, setSusulanDate] = useState<string>(todayStr);
  const [susulanTime, setSusulanTime] = useState<string>(currentHourMinute);
  const [susulanAlasan, setSusulanAlasan] = useState<string>('');
  const [susulanNoDokumenManual, setSusulanNoDokumenManual] = useState<string>('');
  const [susulanError, setSusulanError] = useState<string>('');

  const susulanPresets = [
    'Barang langsung diserahkan oleh staf BMN saat kegiatan/acara sebelum sempat diinput',
    'Permintaan darurat ATK/sarana di luar jam kerja / saat hari libur',
    'Pencatatan retroaktif dari tanda terima logbook fisik BMN',
    'Penyerahan langsung untuk kegiatan operasional pimpinan di lapangan'
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

  const handleAddToCart = () => {
    if (!selectedBarangId || jumlah <= 0) return;
    if (selectedItem && jumlah > selectedItem.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${selectedItem.stokSekarang} ${selectedItem.satuan}.`);
      return;
    }

    const existingIndex = cart.findIndex(c => c.barangId === selectedBarangId);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newJumlah = updatedCart[existingIndex].jumlah + jumlah;
      if (selectedItem && newJumlah > selectedItem.stokSekarang) {
        setValidationError(`Total jumlah di keranjang (${newJumlah}) melebihi stok yang tersedia (${selectedItem.stokSekarang}).`);
        return;
      }
      updatedCart[existingIndex].jumlah = newJumlah;
      updatedCart[existingIndex].stokSisa = (selectedItem?.stokSekarang || 0) - newJumlah;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        cartId: Math.random().toString(36).substr(2, 9),
        barangId: selectedBarangId,
        namaBarang: selectedItem?.nama || '',
        jumlah,
        satuan: selectedItem?.satuan || 'Pcs',
        stokSisa: (selectedItem?.stokSekarang || 0) - jumlah
      }]);
    }

    setJumlah(1);
    setValidationError('');
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(cart.filter(c => c.cartId !== cartId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (cart.length === 0) {
      setValidationError('Keranjang kosong! Silakan tambahkan item terlebih dahulu.');
      return;
    }

    if (viewMode === 'susulan') {
      if (!isAdmin) {
        setSusulanError('Hanya akun Administrator yang berhak menginput data susulan!');
        return;
      }
      if (!susulanDate) {
        setSusulanError('Tanggal fisik penyerahan barang wajib diisi.');
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

    cart.forEach((item, index) => {
      const dateStr = transactionTimestamp.slice(2,10).replace(/-/g, '');
      onProcessTransaksi({
        
        barangId: item.barangId,
        namaBarang: item.namaBarang,
        jumlah: item.jumlah,
        unitId: selectedUnitId,
        petugas,
        keperluan,
        catatan: payloadCatatan,
        tanggal: transactionTimestamp,
        isSusulan: isSusulanMode,
        keteranganSusulan: isSusulanMode ? susulanAlasan : undefined,
        waktuInputSistem: new Date().toISOString()
      });
    });

    // Reset Form
    setCart([]);
    setJumlah(1);
    setKeperluan('');
    setCatatan('');
    setValidationError('');
    setShowConfirmModal(false);
    if (isSusulanMode) {
      setSusulanAlasan('');
      setSusulanNoDokumenManual('');
    }
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

  // Filter history list by search term, selected month, and filter type
  const filteredFinalizedRequests = finalizedRequests.filter(t => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.namaBarang.toLowerCase().includes(q) ||
      t.unitId.toLowerCase().includes(q) ||
      t.petugas.toLowerCase().includes(q) ||
      (t.keperluan && t.keperluan.toLowerCase().includes(q)) ||
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

  const executeExportCSV = (data: BarangKeluar[], summaryText: string) => {
    const headers = 'ID Transaksi,Tipe Catatan,Tanggal Fisik,Waktu Input Sistem,Kode Barang,Nama Barang,Volume,Unit/Subbagian,Petugas,Keperluan,Alasan Susulan,Status\n';
    const rows = data
      .map(
        t =>
          `"${t.id}","${t.isSusulan ? 'DATA SUSULAN' : 'REAL-TIME'}","${new Date(t.tanggal).toLocaleString('id-ID')}","${t.waktuInputSistem ? new Date(t.waktuInputSistem).toLocaleString('id-ID') : '-'}","${t.barangId}","${
            t.namaBarang
          }",-${t.jumlah},"${t.unitId}","${t.petugas}","${(t.keperluan || '').replace(/"/g, '""')}","${(t.keteranganSusulan || '').replace(/"/g, '""')}","${t.statusPersetujuan}"`
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

  const totalTransaksiSusulan = finalizedRequests.filter(t => t.isSusulan).length;

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

      {/* Confirmation Popup Modal */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            {/* Header */}
            <div className={`p-4 text-white flex items-center justify-between ${viewMode === 'susulan' ? 'bg-amber-800' : 'bg-slate-900'}`}>
              <span className="text-xs font-bold flex items-center gap-2">
                {viewMode === 'susulan' ? (
                  <>
                    <CalendarClock className="w-4 h-4 text-amber-300" />
                    KONFIRMASI DISTRIBUSI (DATA SUSULAN)
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    KONFIRMASI DISTRIBUSI BARANG KELUAR
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-black/20 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-slate-700">
              {viewMode === 'susulan' ? (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <Clock className="w-3.5 h-3.5 text-amber-700" /> PENCATATAN RETROAKTIF (DISTRIBUSI SUSULAN)
                  </div>
                  <p>
                    Barang fisik telah diserahkan sebelumnya dan transaksi ini dicatat mundur oleh Administrator sesuai waktu fisik.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-[11px] text-red-900 leading-relaxed">
                  <strong>PERHATIAN:</strong> Konfirmasi ini akan mengurangi stok persediaan BMN secara instan.
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
                  <span className="text-gray-500 font-semibold">Total Item:</span>
                  <span className="col-span-2 font-bold text-gray-900">{cart.length} Jenis Barang</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden my-2">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="py-1.5 px-2 text-left font-bold">Barang</th>
                        <th className="py-1.5 px-2 text-right font-bold">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.map((c) => (
                        <tr key={c.cartId} className="bg-white">
                          <td className="py-1.5 px-2 text-gray-900">{c.namaBarang}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-red-600">-{c.jumlah} {c.satuan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Unit Penerima:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedUnitId}</span>
                </div>
                <div className="grid grid-cols-3 py-1 border-b border-gray-200">
                  <span className="text-gray-500 font-semibold">Petugas Penyerah:</span>
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
                className={`px-4 py-2 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 ${
                  viewMode === 'susulan' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-red-600 hover:bg-red-700'
                }`}
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
        onScanSuccess={(code, item) => {
          if (item) {
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
              Catat pengeluaran BMN untuk unit kerja, proses otorisasi kelayakan stok, input data susulan retroaktif, dan pantau riwayat distribusi.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Selesai / Disetujui</span>
              <span className="text-base font-bold text-white">{finalizedRequests.length} Mutasi</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Menunggu Approval</span>
              <span className="text-base font-bold text-white">{pendingRequests.length} Item</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Data Susulan</span>
              <span className="text-base font-bold text-white">{totalTransaksiSusulan} Transaksi</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Volume Keluar</span>
              <span className="text-base font-bold text-white">-{totalVolumeKeluar} Item</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Controls for 3 Distinct Layout Views */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 px-1 sm:px-0">
          <LayoutGrid className="w-4 h-4 text-red-600 shrink-0" />
          <span>Pilih Tata Letak Layar:</span>
        </div>

        <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          {/* TAB 1: FORM INPUT REALTIME */}
          <button
            onClick={() => setViewMode('form')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center min-w-0 ${
              viewMode === 'form' 
                ? 'bg-white text-red-700 font-bold shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
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
                ? 'bg-white text-red-700 font-bold shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Riwayat Mutasi ({finalizedRequests.length})</span>
            <span className="sm:hidden text-[11px] font-bold truncate">Riwayat ({finalizedRequests.length})</span>
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

      {/* ========================================================================= */}
      {/* LAYOUT 1: STANDARD REAL-TIME FORM INPUT                                  */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="max-w-4xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-50 border-b border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Form Pengeluaran Barang Keluar (Pencatatan Real-Time)
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Gunakan form ini untuk mencatat distribusi BMN yang diserahkan saat ini ke unit kerja. Tanggal & jam sistem dicatat otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> WAKTU AKTIF SISTEM
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {isReadOnly ? (
              <div className="p-8 bg-slate-50 border border-gray-200 rounded-2xl text-center text-xs text-gray-500 space-y-2">
                <ShieldAlert className="w-10 h-10 mx-auto text-slate-400" />
                <p className="font-bold text-sm">Akses Terbatas (Viewer)</p>
                <p>Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk mengajukan mutasi keluar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium text-gray-700">
                {/* 1. SELEKSI BARANG & SEARCH PICKER */}
                <div>
                  <label className="block text-gray-900 font-bold mb-2 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Pilih Item Barang yang Akan Dikeluarkan *
                  </label>
                  <BarangSearchPicker
                    barangList={barangList}
                    kategoriList={kategoriList}
                    selectedBarangId={selectedBarangId}
                    onSelectBarang={(b) => handleBarangChange(b.id)}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    mode="keluar"
                  />
                </div>

                {/* 2. KUANTITAS & SATUAN */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    Kuantitas Volume Distribusi *
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleJumlahChange(jumlah - 5)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJumlahChange(jumlah - 1)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={1}
                        required
                        value={jumlah}
                        onChange={e => handleJumlahChange(parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 text-center font-bold text-red-700 text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleJumlahChange(jumlah + 1)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJumlahChange(jumlah + 5)}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>

                    <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-900 font-bold rounded-xl text-xs flex items-center gap-1.5">
                      <span>Satuan Barang:</span>
                      <span className="text-red-700 uppercase font-mono">{selectedItem?.satuan || 'Pcs'}</span>
                    </div>

                    {selectedItem && (
                      <span className="text-gray-500 text-[11px]">
                        Stok Tersedia: <strong>{selectedItem.stokSekarang} {selectedItem.satuan}</strong> → Sisa Nanti: <strong className="text-red-700 font-bold">{selectedItem.stokSekarang - jumlah} {selectedItem.satuan}</strong>
                      </span>
                    )}
                  </div>

                  {validationError && (
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {validationError}
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Tambah ke Keranjang
                    </button>
                  </div>
                </div>

                {/* KERANJANG BELANJA / DAFTAR BARANG */}
                {cart.length > 0 && (
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-3">
                    <h4 className="font-bold text-red-900 text-xs flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-700" /> Daftar Barang yang Akan Dikeluarkan ({cart.length} item)
                    </h4>
                    <div className="space-y-2">
                      {cart.map((c) => (
                        <div key={c.cartId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100 shadow-xs">
                          <div>
                            <p className="font-bold text-gray-900 text-[11px]">{c.namaBarang}</p>
                            <p className="text-[10px] text-gray-500">ID: {c.barangId} • Sisa Stok: {c.stokSisa} {c.satuan}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-red-600 text-sm">-{c.jumlah} {c.satuan}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(c.cartId)}
                              className="p-1.5 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-md transition-colors cursor-pointer"
                              title="Hapus dari daftar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. UNIT & PETUGAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                      <Building className="w-3.5 h-3.5 text-gray-500" />
                      Unit / Subbagian Pemohon Penerima *
                    </label>
                    <select
                      required
                      value={selectedUnitId}
                      onChange={e => setSelectedUnitId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
                    >
                      {unitList.map(u => (
                        <option key={u.id} value={u.nama}>
                          {u.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                      <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                      Petugas Penyerah BMN *
                    </label>
                    <select
                      required
                      value={petugas}
                      onChange={e => setPetugas(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
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

                {/* 4. KEPERLUAN & CATATAN */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                      Keperluan Distribusi / Nama Kegiatan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Digunakan untuk pencetakan dokumen akreditasi sekolah..."
                      value={keperluan}
                      onChange={e => setKeperluan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">6</span>
                      Catatan Tambahan Pengeluaran (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Catatan kondisi serah terima atau nomor nota dinas..."
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" /> Checkout & Proses Distribusi ({cart.length} Item)
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
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all inline-flex items-center gap-2"
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
                      Form Input Data Susulan (Pencatatan Retroaktif Distribusi BMN)
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-200 mt-1">
                    Gunakan fitur ini ketika fisik barang BMN telah diserahkan langsung ke unit pemohon sebelumnya (misal: saat apel/kegiatan lapangan) dan baru sempat dicatat ke website hari ini.
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
                    Sistem akan menyimpan tanggal dan jam transaksi fisik yang Anda tetapkan sebagai waktu pengeluaran barang, namun tetap mendokumentasikan waktu asli penginputan sistem (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">waktuInputSistem</code>) untuk transparansi audit.
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
                      1. Manipulasi Waktu Distribusi Fisik (Tanggal, Jam, Menit)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-gray-900 font-bold text-xs">
                          Tanggal Fisik Barang Diserahkan *
                        </label>
                        <input
                          type="date"
                          max={todayStr}
                          required
                          value={susulanDate}
                          onChange={e => setSusulanDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs font-semibold text-gray-900"
                        />
                        <span className="text-[10px] text-gray-500 block">Pilih tanggal barang fisik keluar diserahkan ke unit.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-gray-900 font-bold text-xs">
                          Jam & Menit Fisik Diserahkan *
                        </label>
                        <input
                          type="time"
                          required
                          value={susulanTime}
                          onChange={e => setSusulanTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs font-semibold text-gray-900 font-mono"
                        />
                        <span className="text-[10px] text-gray-500 block">Format 24 Jam (Jam:Menit saat fisik diserahkan).</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <label className="block text-gray-900 font-bold text-xs">
                        Alasan / Dasar Pencatatan Susulan * (Rekam Jejak Audit)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Barang diserahkan mendesak pagi hari saat kegiatan lapangan, baru diinput sore..."
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
                        placeholder="Contoh: No. Form Tanda Terima Manual: TTR-2026/04/01"
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
                      Pilih Item Barang yang Telah Diserahkan *
                    </label>
                    <BarangSearchPicker
                      barangList={barangList}
                      kategoriList={kategoriList}
                      selectedBarangId={selectedBarangId}
                      onSelectBarang={(b) => handleBarangChange(b.id)}
                      onOpenScanner={() => setIsScannerOpen(true)}
                      mode="keluar"
                    />
                  </div>

                  {/* SEKSI C: KUANTITAS & UNIT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <label className="block text-gray-900 font-bold text-xs">
                        Kuantitas Volume Distribusi *
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah - 1)}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-r border-gray-200 cursor-pointer"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={1}
                            required
                            value={jumlah}
                            onChange={e => handleJumlahChange(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-2 text-center font-bold text-red-800 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleJumlahChange(jumlah + 1)}
                            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-gray-600 font-bold border-l border-gray-200 cursor-pointer"
                          >
                            +1
                          </button>
                        </div>
                        <span className="px-3 py-2 bg-slate-100 border border-gray-200 font-bold rounded-xl text-xs">
                          {selectedItem?.satuan || 'Pcs'}
                        </span>
                      </div>
                      {validationError && (
                        <p className="text-[10px] text-red-600 font-bold">{validationError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-gray-500" /> Unit / Subbagian Penerima *
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={e => setSelectedUnitId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      >
                        {unitList.map(u => (
                          <option key={u.id} value={u.nama}>
                            {u.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SEKSI D: PETUGAS, KEPERLUAN & CATATAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-gray-900 font-bold text-xs flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-gray-500" /> Petugas Penyerah BMN *
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
                      <label className="block text-gray-900 font-bold text-xs">
                        Keperluan Distribusi / Acara *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Digunakan untuk rapat koordinasi..."
                        value={keperluan}
                        onChange={e => setKeperluan(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-900 font-bold text-xs">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Keterangan kondisi serah terima..."
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Tambah ke Keranjang
                    </button>
                  </div>

                  {/* KERANJANG BELANJA / DAFTAR BARANG */}
                  {cart.length > 0 && (
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
                      <h4 className="font-bold text-amber-900 text-xs flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-700" /> Daftar Barang yang Telah Didistribusikan ({cart.length} item)
                      </h4>
                      <div className="space-y-2">
                        {cart.map((c) => (
                          <div key={c.cartId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-xs">
                            <div>
                              <p className="font-bold text-gray-900 text-[11px]">{c.namaBarang}</p>
                              <p className="text-[10px] text-gray-500">ID: {c.barangId}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-amber-600 text-sm">-{c.jumlah} {c.satuan}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(c.cartId)}
                                className="p-1.5 hover:bg-amber-100 text-amber-500 hover:text-amber-700 rounded-md transition-colors cursor-pointer"
                                title="Hapus dari daftar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <CalendarClock className="w-4 h-4" /> Simpan Data Susulan Distribusi BMN ({cart.length} Item)
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
                <History className="w-4 h-4 text-red-600" />
                Riwayat Distribusi Barang Keluar Selesai
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Menampilkan {filteredFinalizedRequests.length} dari total {finalizedRequests.length} rekam jejak transaksi
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
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="all">🔍 Semua Jenis Transaksi</option>
                <option value="realtime">🟢 Real-Time Saja</option>
                <option value="susulan">⏱️ Data Susulan Saja</option>
              </select>

              {/* Month Filter */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
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
                  placeholder="Cari ID, Barang, Unit..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
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

          {/* DESKTOP / TABLET TABLE VIEW (Visible on >= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                  {isAdmin && (
                    <th className="p-3.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredFinalizedRequests.length && filteredFinalizedRequests.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                    </th>
                  )}
                  <th className="p-3.5">ID & Waktu Transaksi</th>
                  <th className="p-3.5">Item Barang</th>
                  <th className="p-3.5 text-center">Volume</th>
                  <th className="p-3.5">Unit & Keperluan</th>
                  <th className="p-3.5">Petugas & Audit</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                {filteredFinalizedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-10 text-center text-gray-400">
                      <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      Belum ada transaksi barang keluar yang selesai / cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredFinalizedRequests.map((t, idx) => (
                    <tr key={`${t.id}_${idx}`} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(t.id) ? 'bg-red-50/40' : ''}`}>
                      {isAdmin && (
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => handleToggleSelectRow(t.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-bold rounded-lg text-xs font-mono">
                          -{t.jumlah}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-gray-900 font-bold block">{t.unitId}</span>
                        <span className="text-[10px] text-gray-600 block mt-0.5 truncate max-w-[170px]" title={t.keperluan}>
                          Tujuan: "{t.keperluan}"
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-gray-800 font-semibold block truncate max-w-[150px]">{t.petugas}</span>
                        {t.isSusulan ? (
                          <div className="mt-0.5 space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                              <Clock className="w-2.5 h-2.5 text-amber-700" /> Susulan
                            </span>
                            {t.keteranganSusulan && (
                              <p className="text-[9px] text-amber-900 italic truncate max-w-[150px]">
                                {t.keteranganSusulan}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 block">Real-Time</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
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

          {/* MOBILE CARD VIEW (Visible on < 640px) */}
          <div className="block sm:hidden divide-y divide-gray-100">
            {filteredFinalizedRequests.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                Belum ada transaksi barang keluar yang selesai / cocok dengan filter.
              </div>
            ) : (
              filteredFinalizedRequests.map((t, idx) => (
                <div
                  key={`mobile_out_${t.id}_${idx}`}
                  className={`p-4 space-y-3 transition-colors ${
                    selectedIds.includes(t.id) ? 'bg-red-50/50' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Top Bar: Checkbox + ID + Volume Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t.id)}
                          onChange={() => handleToggleSelectRow(t.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                        />
                      )}
                      <div className="flex items-center gap-1">
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-bold rounded-lg text-xs font-mono">
                        -{t.jumlah} Unit
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.statusPersetujuan === 'Disetujui'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {t.statusPersetujuan === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>
                  </div>

                  {/* Item Name & ID */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.namaBarang}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">ID Barang: {t.barangId}</span>
                  </div>

                  {/* Metadata Grid */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Waktu Transaksi:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Unit Penerima:</span>
                        <span className="font-bold text-gray-900 truncate block">{t.unitId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1.5 border-t border-slate-200/60">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Petugas BMN:</span>
                        <span className="font-semibold text-gray-800 truncate block">{t.petugas}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Tipe Pencatatan:</span>
                        {t.isSusulan ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                            <Clock className="w-2.5 h-2.5 text-amber-700" /> Susulan
                          </span>
                        ) : (
                          <span className="text-blue-700 font-semibold text-[10px]">🟢 Real-Time</span>
                        )}
                      </div>
                    </div>

                    {t.keperluan && (
                      <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-gray-400 block text-[10px]">Keperluan / Peruntukan:</span>
                        <p className="text-gray-800 font-medium">
                          "{t.keperluan}"
                        </p>
                      </div>
                    )}

                    {t.keteranganSusulan && (
                      <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-amber-700 block text-[10px] font-bold">Alasan Susulan:</span>
                        <p className="text-amber-900 italic">
                          "{t.keteranganSusulan}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Export Confirm Modal */}
      <ExportConfirmModal<BarangKeluar>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Konfirmasi Ekspor Data Barang Keluar"
        description="Pilih periode bulan atau hari transaksi barang keluar yang akan diunduh"
        dataList={filteredFinalizedRequests}
        getDateFn={item => item.tanggal || ''}
        onConfirm={(filteredData, format, summaryText) => {
          executeExportCSV(filteredData, summaryText);
        }}
      />
    </div>
  );
}
