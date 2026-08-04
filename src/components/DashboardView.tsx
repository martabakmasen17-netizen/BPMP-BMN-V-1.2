/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  Users2,
  Tags,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { Barang, ActiveTab, AuditLog, Unit, Pegawai, BarangKeluar, Kategori } from '../types';
import QRScannerModal from './QRScannerModal';
import DashboardCharts from './DashboardCharts';
import { useState, useEffect } from 'react';
import { Check, X, ShieldAlert, Clock } from 'lucide-react';

interface DashboardViewProps {
  barang: Barang[];
  kategoriList?: Kategori[];
  categoriesCount: number;
  suppliersCount: number;
  barangMasukCountToday: number;
  barangKeluarCountToday: number;
  recentLogs: AuditLog[];
  setActiveTab: (tab: ActiveTab) => void;
  setQuickAddType?: (type: 'masuk' | 'keluar') => void;
  setQuickAddBarangId?: (id: string) => void;
  unitList: Unit[];
  pegawaiList: Pegawai[];
  onProcessTransaksi: (t: Omit<BarangKeluar, 'id' | 'tanggal' | 'statusPersetujuan'>) => void;
}

export default function DashboardView({
  barang,
  kategoriList = [],
  categoriesCount,
  suppliersCount,
  barangMasukCountToday,
  barangKeluarCountToday,
  recentLogs,
  setActiveTab,
  setQuickAddType,
  setQuickAddBarangId,
  unitList,
  pegawaiList,
  onProcessTransaksi
}: DashboardViewProps) {
  // Calculations
  const totalBarang = barang.length;
  const stokAman = barang.filter(b => Number(b.stokSekarang) >= Number(b.stokMin) && Number(b.stokSekarang) > 0).length;
  const stokMenipis = barang.filter(b => Number(b.stokSekarang) < Number(b.stokMin) && Number(b.stokSekarang) > 0).length;
  const stokHabis = barang.filter(b => Number(b.stokSekarang) === 0).length;

  const totalStokUnit = barang.reduce((sum, item) => sum + Number(item.stokSekarang), 0);

  // Get items with low stock (stokSekarang < stokMin)
  const barangRendah = barang.filter(b => b.stokSekarang < b.stokMin).sort((a, b) => a.stokSekarang - b.stokSekarang);

  // Categorize for charts
  const categoryCounts: { [key: string]: number } = {};
  barang.forEach(b => {
    const kat = b.kategori || 'Tanpa Kategori';
    const stok = Number(b.stokSekarang) || 0;
    categoryCounts[kat] = (categoryCounts[kat] || 0) + stok;
  });

  const chartCategories = Object.keys(categoryCounts).map(cat => ({
    name: cat.split('(')[0].trim(), // shorten name
    value: categoryCounts[cat]
  })).sort((a, b) => b.value - a.value);

  const maxCatValue = Math.max(...chartCategories.map(c => c.value), 1) || 1;

  // Dashboard QR scan states (Scanning Category QR)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedKategori, setScannedKategori] = useState<Kategori | null>(null);
  const [selectedBarangId, setSelectedBarangId] = useState<string>('');

  // Items in scanned category
  const categoryItems = scannedKategori
    ? barang.filter(b =>
        b.kategoriId === scannedKategori.id ||
        b.kategori === scannedKategori.nama ||
        (b.kategori && scannedKategori.nama && b.kategori.toLowerCase().includes(scannedKategori.nama.toLowerCase()))
      )
    : [];

  const selectedItem = categoryItems.find(b => b.id === selectedBarangId) || categoryItems[0] || null;

  // Form states inside locked modal
  const [jumlah, setJumlah] = useState<number>(1);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [petugas, setPetugas] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sync default options when scannedKategori or lists change
  useEffect(() => {
    if (scannedKategori) {
      setJumlah(1);
      setKeperluan('');
      setCatatan('');
      setValidationError('');
      const items = barang.filter(b =>
        b.kategoriId === scannedKategori.id ||
        b.kategori === scannedKategori.nama ||
        (b.kategori && scannedKategori.nama && b.kategori.toLowerCase().includes(scannedKategori.nama.toLowerCase()))
      );
      if (items.length > 0) {
        setSelectedBarangId(items[0].id);
      } else {
        setSelectedBarangId('');
      }
      if (unitList && unitList.length > 0) {
        setSelectedUnitId(unitList[0].nama);
      }
      if (pegawaiList && pegawaiList.length > 0) {
        setPetugas(pegawaiList[0].nama);
      } else {
        setPetugas('Roni Setiawan');
      }
    }
  }, [scannedKategori, barang, unitList, pegawaiList]);

  const handleBarangSelectionChange = (bId: string) => {
    setSelectedBarangId(bId);
    setValidationError('');
    const target = categoryItems.find(x => x.id === bId);
    if (target && jumlah > target.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${target.stokSekarang} ${target.satuan}.`);
    }
  };

  const handleLockedJumlahChange = (val: number) => {
    setJumlah(val);
    setValidationError('');
    if (selectedItem && val > selectedItem.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${selectedItem.stokSekarang} ${selectedItem.satuan}.`);
    }
  };

  const handleLockedFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedKategori || !selectedItem || jumlah <= 0) return;

    if (jumlah > selectedItem.stokSekarang) {
      setValidationError(`Stok tidak mencukupi! Tersedia hanya ${selectedItem.stokSekarang} ${selectedItem.satuan}.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleLockedFormConfirm = () => {
    if (!selectedItem) return;
    onProcessTransaksi({
      barangId: selectedItem.id,
      namaBarang: selectedItem.nama,
      jumlah,
      unitId: selectedUnitId,
      petugas,
      keperluan,
      catatan
    });
    
    // Reset
    setScannedKategori(null);
    setSelectedBarangId('');
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick actions */}
      <div className="bg-gradient-to-r from-[#111827] to-[#1e293b] rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Halo, Petugas BMN BPMP Sumsel!</h2>
          <p className="text-white/80 text-xs mt-1 max-w-xl leading-relaxed">
            Selamat datang di portal Sistem Informasi Monitoring Persediaan Barang. Lakukan administrasi pergudangan secara digital, terintegrasi, dan real-time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (setQuickAddType) setQuickAddType('masuk');
              setActiveTab('barang_masuk');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#111827] hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border border-[#E5E7EB]"
          >
            <PlusCircle className="w-4 h-4 text-green-600" />
            Barang Masuk
          </button>
          <button
            onClick={() => {
              if (setQuickAddType) setQuickAddType('keluar');
              setActiveTab('barang_keluar');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white hover:bg-blue-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-blue-200" />
            Barang Keluar
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-95 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <QrCode className="w-4 h-4 text-blue-200" />
            Pindai QR Kategori
          </button>
        </div>
      </div>

      {/* QR Scanner Modals inside Dashboard */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code, matchedItem, matchedKategori) => {
          let kat: Kategori | null = matchedKategori || null;
          if (!kat && matchedItem) {
            kat = kategoriList.find(k => k.id === matchedItem.kategoriId || k.nama === matchedItem.kategori) || null;
          }
          if (!kat && code) {
            const text = code.trim().toLowerCase();
            kat = kategoriList.find(k => k.id.toLowerCase() === text || k.nama.toLowerCase() === text) || null;
          }
          if (kat) {
            setScannedKategori(kat);
          } else if (kategoriList.length > 0) {
            setScannedKategori(kategoriList[0]);
          }
        }}
        barangList={barang}
        kategoriList={kategoriList}
      />

      {/* Scanned Locked Checkout Form Modal for Category */}
      {scannedKategori && !showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden text-xs max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <QrCode className="w-4.5 h-4.5 text-blue-600 animate-bounce" />
                DISTRIBUSI SCAN QR KATEGORI (BARANG KELUAR)
              </span>
              <button
                type="button"
                onClick={() => setScannedKategori(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLockedFormSubmit} className="p-4 sm:p-5 space-y-3.5 font-medium text-slate-700 overflow-y-auto flex-1">
              <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl leading-relaxed text-[10.5px] border border-blue-100">
                Kategori barang berhasil dipindai via QR. Kategori dikunci ke: <strong className="text-blue-800">"{scannedKategori.nama}"</strong>.
              </div>

              {/* Locked Kategori Display */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Kategori Terpilih (KUNCI QR)</label>
                <div className="p-2.5 sm:p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-800 flex justify-between items-center gap-2">
                  <span className="truncate">{scannedKategori.id} - {scannedKategori.nama}</span>
                  <span className="flex-shrink-0 font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Terkunci QR Kategori</span>
                </div>
              </div>

              {/* Item Selection inside Scanned Kategori */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Pilih Item Barang Dalam Kategori *</label>
                {categoryItems.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                    Belum ada item barang terdaftar dalam kategori ini.
                  </div>
                ) : (
                  <select
                    value={selectedItem ? selectedItem.id : ''}
                    onChange={e => handleBarangSelectionChange(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-xs font-bold text-gray-900"
                  >
                    {categoryItems.map((b, idx) => (
                      <option key={`${b.id}_${idx}`} value={b.id} disabled={b.stokSekarang === 0}>
                        [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan}) {b.stokSekarang === 0 ? '[KOSONG]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stock & Location Display if item exists */}
              {selectedItem && (
                <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-gray-100 rounded-xl text-[10.5px] text-gray-600">
                  <div>
                    <span>Stok Tersedia: </span>
                    <span className="font-bold text-gray-900">{selectedItem.stokSekarang} {selectedItem.satuan}</span>
                  </div>
                  <div>
                    <span>Lokasi Rak: </span>
                    <span className="font-bold text-gray-900">{selectedItem.lokasiRak || '-'}</span>
                  </div>
                </div>
              )}

              {/* Volume */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Jumlah Volume Keluar *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={!selectedItem || selectedItem.stokSekarang === 0}
                    value={jumlah}
                    onChange={e => handleLockedJumlahChange(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-1.5 sm:py-2 border rounded-xl focus:outline-none focus:ring-2 text-xs ${
                      validationError ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-700' : 'border-gray-200 focus:ring-blue-600'
                    }`}
                  />
                  <span className="px-3.5 py-1.5 sm:py-2 bg-slate-100 border border-gray-200 text-gray-500 font-bold rounded-xl flex items-center justify-center text-xs">
                    {selectedItem?.satuan || 'Pcs'}
                  </span>
                </div>
                {validationError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">{validationError}</p>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Unit Kerja Penerima *</label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-xs"
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
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Petugas Penanggung Jawab *</label>
                <select
                  required
                  value={petugas}
                  onChange={e => setPetugas(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-xs"
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

              {/* Keperluan */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Keperluan Penggunaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kegiatan rapat evaluasi / cetak dokumen"
                  value={keperluan}
                  onChange={e => setKeperluan(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">Catatan Pengeluaran</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kondisi penyerahan barang (opsional)..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setScannedKategori(null)}
                  className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedItem || !!validationError || selectedItem.stokSekarang === 0}
                  className="flex-1 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Keluarkan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanned Locked Form Confirmation Dialog Overlay */}
      {scannedKategori && selectedItem && showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden text-xs text-slate-700">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center gap-1.5 font-bold text-gray-900">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
              KONFIRMASI BARANG KELUAR (SCAN QR KATEGORI)
            </div>
            
            <div className="p-5 space-y-4">
              <p className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-800 leading-normal text-[11px]">
                Apakah Anda yakin data distribusi barang berikut sudah benar? Stok barang akan langsung dikurangi.
              </p>

              <div className="space-y-2 border-y border-gray-100 py-3">
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Kategori:</span>
                  <span className="col-span-2 font-bold text-slate-900">{scannedKategori.nama}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Nama Barang:</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedItem.nama}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Volume Keluar:</span>
                  <span className="col-span-2 font-bold text-red-600">-{jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Sisa Stok Nanti:</span>
                  <span className="col-span-2 font-bold text-slate-800">{selectedItem.stokSekarang - jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Unit Penerima:</span>
                  <span className="col-span-2 font-bold text-slate-900">{selectedUnitId}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Petugas:</span>
                  <span className="col-span-2 font-bold text-slate-900">{petugas}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400 font-semibold">Tujuan:</span>
                  <span className="col-span-2 text-slate-900 font-medium">"{keperluan}"</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleLockedFormConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Ya, Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Total Items */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-[#2563EB]/10 p-3 rounded-lg text-[#2563EB]">
            <Package className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Total Item Barang</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{totalBarang}</span>
            <span className="text-[10px] text-[#6B7280] font-medium">{totalStokUnit} Total Unit Stok</span>
          </div>
        </div>

        {/* Card Stok Aman */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Aman</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{stokAman}</span>
            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
              {totalBarang > 0 ? Math.round((stokAman / totalBarang) * 100) : 0}% dari total barang
            </span>
          </div>
        </div>

        {/* Card Stok Menipis */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Menipis</span>
            <span className="text-2xl font-bold text-[#DC2626] block mt-0.5">{stokMenipis}</span>
            <span className="text-[10px] text-amber-600 font-semibold">
              Butuh Pengadaan Segera
            </span>
          </div>
        </div>

        {/* Card Stok Habis */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <XOctagon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Kosong</span>
            <span className="text-2xl font-bold text-[#DC2626] block mt-0.5">{stokHabis}</span>
            <span className="text-[10px] text-red-600 font-semibold">
              Menghentikan Permintaan
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Card Transactions */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Masuk Hari Ini</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangMasukCountToday} Transaksi</span>
            <span className="text-[10px] text-[#6B7280] font-medium">Masuk gudang BMN</span>
          </div>
        </div>

        {/* Card Transactions Out */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Keluar Hari Ini</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangKeluarCountToday} Transaksi</span>
            <span className="text-[10px] text-[#6B7280] font-medium">Diserahkan ke unit kerja</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modern Interactive Dashboard Charts (2 cols on large screen) */}
        <div className="lg:col-span-2">
          <DashboardCharts
            barang={barang}
            kategoriList={kategoriList}
            onQuickRestock={(bId) => {
              if (setQuickAddType && setQuickAddBarangId) {
                setQuickAddType('masuk');
                setQuickAddBarangId(bId);
              }
              setActiveTab('barang_masuk');
            }}
          />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
            <h3 className="font-bold text-[#111827] text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Peringatan Stok Menipis
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
              {barangRendah.length} Item
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80 scrollbar-thin">
            {barangRendah.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B7280] flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                Seluruh stok barang aman!
              </div>
            ) : (
              barangRendah.map(item => (
                <div key={item.id} className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827] truncate">{item.nama}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{item.kategori} • Rak: {item.lokasiRak}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.stokSekarang === 0 ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                        {item.stokSekarang} {item.satuan}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-medium">Min: {item.stokMin}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (setQuickAddType && setQuickAddBarangId) {
                        setQuickAddType('masuk');
                        setQuickAddBarangId(item.id);
                      }
                      setActiveTab('barang_masuk');
                    }}
                    className="flex-shrink-0 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                  >
                    Restok
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
          <h3 className="font-bold text-[#111827] text-sm">
            Log Aktivitas Sistem Terkini
          </h3>
          <button
            onClick={() => setActiveTab('audit_log')}
            className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
          >
            Lihat Semua Log
          </button>
        </div>

        <div className="divide-y divide-[#E5E7EB]">
          {recentLogs.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#6B7280]">Belum ada aktivitas tercatat</div>
          ) : (
            recentLogs.slice(0, 5).map(log => (
              <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                <div className="min-w-[120px] text-[#6B7280] font-medium">
                  {new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(log.tanggal).toLocaleDateString('id-ID')}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-[#111827] mr-1.5">{log.aktor}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[9px] mr-1.5 uppercase">{log.role}</span>
                  <span className="text-[#111827] font-medium">{log.aksi}: </span>
                  <span className="text-[#6B7280]">{log.detail}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
