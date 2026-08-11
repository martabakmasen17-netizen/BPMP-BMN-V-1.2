/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Scale,
  Calculator,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { Satuan, TipeSatuan } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { STANDARD_SATUAN_PRESETS, getEquivalentBaseStock, findUnitPreset, enrichSatuanListWithDefaults } from '../utils/unitUtils';

interface SatuanViewProps {
  satuanList: Satuan[];
  onAddSatuan: (s: Omit<Satuan, 'id'>) => void;
  onEditSatuan: (id: string, s: Partial<Satuan>) => void;
  onDeleteSatuan: (id: string) => void;
  onSyncStandards?: (enrichedList: Satuan[]) => void;
  currentUserRole: string;
}

export default function SatuanView({
  satuanList,
  onAddSatuan,
  onEditSatuan,
  onDeleteSatuan,
  onSyncStandards,
  currentUserRole
}: SatuanViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmSyncModal, setShowConfirmSyncModal] = useState(false);
  const [satuanToDelete, setSatuanToDelete] = useState<Satuan | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Interactive Live Converter & Simulator State
  const [simUnit, setSimUnit] = useState<string>('Lusin');
  const [simQty, setSimQty] = useState<number>(5);
  const [showSimulator, setShowSimulator] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState<Omit<Satuan, 'id'>>({
    nama: '',
    keterangan: '',
    tipe: 'kemasan',
    faktorKonversi: 12,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 1,
    rekomendasiStokMaks: 20
  });

  const [editFormData, setEditFormData] = useState<Partial<Satuan>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  // Master stats
  const enrichedList = useMemo(() => enrichSatuanListWithDefaults(satuanList), [satuanList]);
  
  const stats = useMemo(() => {
    const total = enrichedList.length;
    const kemasan = enrichedList.filter(s => s.tipe === 'kemasan').length;
    const tunggal = enrichedList.filter(s => s.tipe === 'tunggal').length;
    const lembaranDanLainnya = enrichedList.filter(s => s.tipe !== 'kemasan' && s.tipe !== 'tunggal').length;
    return { total, kemasan, tunggal, lembaranDanLainnya };
  }, [enrichedList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return enrichedList.filter(s => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.satuanDasar && s.satuanDasar.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = typeFilter === 'all' ? true : s.tipe === typeFilter;
      return matchSearch && matchType;
    });
  }, [enrichedList, searchTerm, typeFilter]);

  // Converter calculation for simulator
  const simResult = useMemo(() => {
    const safeQty = Math.max(0, simQty || 0);
    const equiv = getEquivalentBaseStock(safeQty, simUnit, enrichedList);
    const selectedSatuan = enrichedList.find(s => s.nama.toLowerCase() === simUnit.toLowerCase());
    const recMin = selectedSatuan?.rekomendasiStokMin || 1;
    const recMinEquiv = getEquivalentBaseStock(recMin, simUnit, enrichedList);
    const isSafe = safeQty > recMin;
    const isLow = safeQty > 0 && safeQty <= recMin;
    const isEmpty = safeQty === 0;

    return {
      qty: safeQty,
      unit: simUnit,
      baseQty: equiv.baseQty,
      baseUnit: equiv.baseSatuan,
      factor: equiv.faktorKonversi,
      isMultiUnit: equiv.isMultiUnit,
      recMin,
      recMinEquivBase: recMinEquiv.baseQty,
      isSafe,
      isLow,
      isEmpty,
      statusLabel: isEmpty ? 'Stok Habis' : isLow ? 'Stok Menipis (Kritis)' : 'Stok Aman'
    };
  }, [simUnit, simQty, enrichedList]);

  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      keterangan: '',
      tipe: 'kemasan',
      faktorKonversi: 12,
      satuanDasar: 'Buah',
      rekomendasiStokMin: 1,
      rekomendasiStokMaks: 20
    });
    setShowAddModal(true);
  };

  const handlePresetSelect = (presetName: string, isEdit = false) => {
    const preset = findUnitPreset(presetName);
    if (!preset) return;
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        nama: preset.nama,
        keterangan: preset.keterangan,
        tipe: preset.tipe,
        faktorKonversi: preset.faktorKonversi,
        satuanDasar: preset.satuanDasar,
        rekomendasiStokMin: preset.rekomendasiStokMin,
        rekomendasiStokMaks: preset.rekomendasiStokMaks
      }));
    } else {
      setFormData({
        nama: preset.nama,
        keterangan: preset.keterangan,
        tipe: preset.tipe,
        faktorKonversi: preset.faktorKonversi,
        satuanDasar: preset.satuanDasar,
        rekomendasiStokMin: preset.rekomendasiStokMin,
        rekomendasiStokMaks: preset.rekomendasiStokMaks
      });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;
    setShowConfirmAddModal(true);
  };

  const handleConfirmAdd = () => {
    onAddSatuan({
      nama: formData.nama.trim(),
      keterangan: formData.keterangan.trim(),
      tipe: formData.tipe || 'tunggal',
      faktorKonversi: Number(formData.faktorKonversi) || 1,
      satuanDasar: formData.satuanDasar?.trim() || 'Buah',
      rekomendasiStokMin: Number(formData.rekomendasiStokMin) || 1,
      rekomendasiStokMaks: Number(formData.rekomendasiStokMaks) || 20
    });
    setShowConfirmAddModal(false);
    setShowAddModal(false);
  };

  const handleDeleteClick = (s: Satuan) => {
    setSatuanToDelete(s);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (satuanToDelete) {
      onDeleteSatuan(satuanToDelete.id);
      setShowConfirmDeleteModal(false);
      setSatuanToDelete(null);
    }
  };

  const handleOpenEdit = (s: Satuan) => {
    const meta = enrichSatuanListWithDefaults([s])[0];
    setEditFormData(meta);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditSatuan(editFormData.id, {
      ...editFormData,
      faktorKonversi: Number(editFormData.faktorKonversi) || 1,
      rekomendasiStokMin: Number(editFormData.rekomendasiStokMin) || 1,
      rekomendasiStokMaks: Number(editFormData.rekomendasiStokMaks) || 20
    });
    setShowEditModal(false);
  };

  const handleConfirmSyncStandards = () => {
    if (onSyncStandards) {
      onSyncStandards(enrichedList);
    } else {
      // Direct updates via onEditSatuan for all items
      enrichedList.forEach(item => {
        onEditSatuan(item.id, item);
      });
    }
    setShowConfirmSyncModal(false);
  };

  const getTypeBadge = (tipe?: TipeSatuan) => {
    switch (tipe) {
      case 'kemasan':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Kemasan / Grosir</span>;
      case 'tunggal':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tunggal / Biji</span>;
      case 'lembaran':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Lembaran</span>;
      case 'panjang':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Ukuran Panjang</span>;
      case 'volume':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Volume / Cairan</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Lainnya</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Master Satuan</p>
            <h3 className="text-xl font-black text-gray-900 mt-0.5">{stats.total} Satuan</h3>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Standar Inventaris BMN</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Satuan Kemasan (Multi)</p>
            <h3 className="text-xl font-black text-blue-700 mt-0.5">{stats.kemasan} Tipe</h3>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Lusin, Kotak, Box, Rim, Pak</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Satuan Eceran Tunggal</p>
            <h3 className="text-xl font-black text-emerald-700 mt-0.5">{stats.tunggal} Tipe</h3>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Buah, Unit, Eksemplar</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lembaran & Spesifik</p>
            <h3 className="text-xl font-black text-purple-700 mt-0.5">{stats.lembaranDanLainnya} Tipe</h3>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Lembar, Rol, Meter, Botol</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Stock Intelligence & Conversion Simulator */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-750 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Simulasi Logika Normalisasi Stok Satuan
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-mono">
                  Smart Multi-Unit Engine
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Membedakan secara akurat antara stok kemasan grosir (misal: <strong>5 Lusin = 60 Buah</strong> [Aman]) dan stok eceran (misal: <strong>6 Buah</strong> [Menipis]).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="self-start md:self-auto text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer font-bold"
          >
            {showSimulator ? 'Sembunyikan Simulator' : 'Buka Simulator'}
          </button>
        </div>

        {showSimulator && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Input Controls */}
            <div className="lg:col-span-5 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-3.5">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Uji Coba Perhitungan Satuan:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Pilih Satuan</label>
                  <select
                    value={simUnit}
                    onChange={e => setSimUnit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {enrichedList.map(s => (
                      <option key={s.id} value={s.nama}>
                        {s.nama} {s.faktorKonversi && s.faktorKonversi > 1 ? `(1 ${s.nama} = ${s.faktorKonversi} ${s.satuanDasar})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Jumlah Stok Fisik</label>
                  <input
                    type="number"
                    min="0"
                    value={simQty}
                    onChange={e => setSimQty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400">Contoh Kasus:</span>
                <button
                  type="button"
                  onClick={() => { setSimUnit('Lusin'); setSimQty(5); }}
                  className="text-[10px] px-2 py-1 bg-slate-700/80 hover:bg-slate-600 text-blue-300 rounded font-semibold transition cursor-pointer"
                >
                  Pena 5 Lusin
                </button>
                <button
                  type="button"
                  onClick={() => { setSimUnit('Buah'); setSimQty(6); }}
                  className="text-[10px] px-2 py-1 bg-slate-700/80 hover:bg-slate-600 text-amber-300 rounded font-semibold transition cursor-pointer"
                >
                  Pena 6 Buah
                </button>
                <button
                  type="button"
                  onClick={() => { setSimUnit('Rim'); setSimQty(2); }}
                  className="text-[10px] px-2 py-1 bg-slate-700/80 hover:bg-slate-600 text-purple-300 rounded font-semibold transition cursor-pointer"
                >
                  Kertas 2 Rim
                </button>
              </div>
            </div>

            {/* Real-time Calculation Result */}
            <div className="lg:col-span-7 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hasil Evaluasi Cerdas:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    simResult.isEmpty ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    simResult.isLow ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {simResult.isEmpty ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     simResult.isLow ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     <CheckCircle2 className="w-3.5 h-3.5" />}
                    {simResult.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-medium">Input Stok</p>
                    <p className="text-sm font-black text-white mt-0.5">{simResult.qty} {simResult.unit}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-medium">Kuantitas Fisik Setara</p>
                    <p className="text-sm font-black text-blue-400 mt-0.5">
                      {simResult.baseQty.toLocaleString('id-ID')} {simResult.baseUnit}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-400 font-medium">Batas Rekomendasi Min</p>
                    <p className="text-sm font-black text-slate-200 mt-0.5">
                      {simResult.recMin} {simResult.unit} {simResult.isMultiUnit ? `(${simResult.recMinEquivBase} ${simResult.baseUnit})` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>
                  {simResult.isMultiUnit ? (
                    <>Faktor konversi aktif: <strong>1 {simResult.unit} = {simResult.factor} {simResult.baseUnit}</strong>. Sistem mendeteksi total kuantitas rill adalah {simResult.baseQty} {simResult.baseUnit}.</>
                  ) : (
                    <>Satuan tunggal: <strong>{simResult.qty} {simResult.unit}</strong>. Batas minimum aman untuk barang eceran adalah {simResult.recMin} {simResult.unit}.</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama satuan, tipe, dasar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Semua Tipe' },
              { id: 'kemasan', label: 'Kemasan' },
              { id: 'tunggal', label: 'Tunggal' },
              { id: 'lembaran', label: 'Lembaran' },
              { id: 'panjang', label: 'Panjang' },
              { id: 'volume', label: 'Volume' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowConfirmSyncModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-gray-200"
              title="Perbarui data master satuan dengan standar faktor konversi BMN"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Sinkronkan Standar BMN
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Satuan
            </button>
          </div>
        )}
      </div>

      {/* Grid of Satuan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredList.map(s => {
          const isMulti = Number(s.faktorKonversi) > 1;
          return (
            <div
              key={s.id}
              className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-[10px] font-bold text-gray-400">{s.id}</span>
                  </div>
                  {getTypeBadge(s.tipe)}
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-base">{s.nama}</h4>
                  <p className="text-gray-500 text-[11px] leading-relaxed mt-1 min-h-[32px]">
                    {s.keterangan || 'Satuan pengukuran persediaan BMN.'}
                  </p>
                </div>

                {/* Conversion Info Badge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-150 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Faktor Konversi:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                      {isMulti ? `1 ${s.nama} = ${s.faktorKonversi} ${s.satuanDasar}` : `1 ${s.nama} (Tunggal)`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200/60">
                    <span className="text-gray-500">Batas Min Standar:</span>
                    <span className="font-bold text-gray-800">
                      {s.rekomendasiStokMin || 1} {s.nama}
                      {isMulti && ` (${(Number(s.rekomendasiStokMin) || 1) * Number(s.faktorKonversi)} ${s.satuanDasar})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Batas Maks Standar:</span>
                    <span className="font-bold text-gray-800">
                      {s.rekomendasiStokMaks || 20} {s.nama}
                    </span>
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 hover:bg-slate-100 text-amber-600 rounded-lg cursor-pointer transition"
                    title="Ubah Satuan & Rumus Konversi"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(s)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer transition"
                    title="Hapus Satuan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Tambah Satuan Ukuran & Konversi</h3>
                <p className="text-[11px] text-gray-500">Daftarkan satuan baru beserta faktor pengali fisik persediaan.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs font-medium text-gray-700">
              {/* Quick Template Picker */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/60 space-y-1.5">
                <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Pilih dari Standar Satuan BMN (Otomatis Isi Form):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_SATUAN_PRESETS.slice(0, 10).map(p => (
                    <button
                      key={p.nama}
                      type="button"
                      onClick={() => handlePresetSelect(p.nama, false)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition cursor-pointer shadow-2xs"
                    >
                      {p.nama} ({p.faktorKonversi} {p.satuanDasar})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Nama Satuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lusin, Rim, Dus, Pcs..."
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Kategori / Tipe Satuan *</label>
                  <select
                    value={formData.tipe}
                    onChange={e => setFormData({ ...formData, tipe: e.target.value as TipeSatuan })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="kemasan">Kemasan / Grosir (Multi Item)</option>
                    <option value="tunggal">Tunggal / Eceran (1 Biji)</option>
                    <option value="lembaran">Lembaran (Kertas / Mika)</option>
                    <option value="panjang">Panjang Linear (Meter/Rol)</option>
                    <option value="volume">Volume Cairan (Botol/Tube)</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Conversion Factor & Base Unit */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-[11px] font-bold text-gray-700">Rumus Konversi ke Satuan Fisik Terkecil:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-gray-500 text-[11px]">Faktor Pengali (Isi Per Kemasan)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.faktorKonversi}
                      onChange={e => setFormData({ ...formData, faktorKonversi: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-blue-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-500 text-[11px]">Satuan Dasar Terkecil</label>
                    <select
                      value={formData.satuanDasar}
                      onChange={e => setFormData({ ...formData, satuanDasar: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Buah">Buah (Item Tunggal)</option>
                      <option value="Lembar">Lembar (Kertas)</option>
                      <option value="Unit">Unit (Perangkat)</option>
                      <option value="Meter">Meter (Panjang)</option>
                      <option value="Rol">Rol (Gulungan)</option>
                      <option value="Botol">Botol (Cairan)</option>
                      <option value="Tube">Tube (Pasta)</option>
                      <option value="Eksemplar">Eksemplar (Buku)</option>
                      <option value="Set">Set (Paket)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-blue-800 bg-blue-100/60 p-2 rounded-lg font-medium flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Artinya: <strong>1 {formData.nama || '[Satuan]'} = {formData.faktorKonversi || 1} {formData.satuanDasar}</strong>
                  </span>
                </div>
              </div>

              {/* Recommended Min & Max stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Rekomendasi Batas Min Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rekomendasiStokMin}
                    onChange={e => setFormData({ ...formData, rekomendasiStokMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 block">Batas peringatan stok menipis</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Rekomendasi Batas Maks Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rekomendasiStokMaks}
                    onChange={e => setFormData({ ...formData, rekomendasiStokMaks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 block">Kapasitas penyimpanan aman</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-600 font-semibold">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Contoh: Satuan kemasan grosir untuk alat tulis pena..."
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Simpan Satuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Ubah Satuan & Rumus Konversi</h3>
                <p className="text-[11px] text-gray-500">Kode Satuan: <span className="font-mono font-bold text-gray-700">{editFormData.id}</span></p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs font-medium text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Nama Satuan *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nama}
                    onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Kategori / Tipe Satuan *</label>
                  <select
                    value={editFormData.tipe || 'tunggal'}
                    onChange={e => setEditFormData({ ...editFormData, tipe: e.target.value as TipeSatuan })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="kemasan">Kemasan / Grosir (Multi Item)</option>
                    <option value="tunggal">Tunggal / Eceran (1 Biji)</option>
                    <option value="lembaran">Lembaran (Kertas / Mika)</option>
                    <option value="panjang">Panjang Linear (Meter/Rol)</option>
                    <option value="volume">Volume Cairan (Botol/Tube)</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Conversion Factor & Base Unit */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-[11px] font-bold text-gray-700">Rumus Konversi ke Satuan Fisik Terkecil:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-gray-500 text-[11px]">Faktor Pengali (Isi Per Satuan)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editFormData.faktorKonversi || 1}
                      onChange={e => setEditFormData({ ...editFormData, faktorKonversi: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-blue-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-500 text-[11px]">Satuan Dasar Terkecil</label>
                    <select
                      value={editFormData.satuanDasar || 'Buah'}
                      onChange={e => setEditFormData({ ...editFormData, satuanDasar: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Buah">Buah (Item Tunggal)</option>
                      <option value="Lembar">Lembar (Kertas)</option>
                      <option value="Unit">Unit (Perangkat)</option>
                      <option value="Meter">Meter (Panjang)</option>
                      <option value="Rol">Rol (Gulungan)</option>
                      <option value="Botol">Botol (Cairan)</option>
                      <option value="Tube">Tube (Pasta)</option>
                      <option value="Eksemplar">Eksemplar (Buku)</option>
                      <option value="Set">Set (Paket)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-blue-800 bg-blue-100/60 p-2 rounded-lg font-medium flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Artinya: <strong>1 {editFormData.nama || '[Satuan]'} = {editFormData.faktorKonversi || 1} {editFormData.satuanDasar || 'Buah'}</strong>
                  </span>
                </div>
              </div>

              {/* Recommended Min & Max stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Rekomendasi Batas Min Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.rekomendasiStokMin || 1}
                    onChange={e => setEditFormData({ ...editFormData, rekomendasiStokMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 block">Batas peringatan stok menipis</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-600 font-semibold">Rekomendasi Batas Maks Stok</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.rekomendasiStokMaks || 20}
                    onChange={e => setEditFormData({ ...editFormData, rekomendasiStokMaks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 block">Kapasitas penyimpanan aman</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  value={editFormData.keterangan || ''}
                  onChange={e => setEditFormData({ ...editFormData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Adding Satuan */}
      <ConfirmationModal
        isOpen={showConfirmAddModal}
        onClose={() => setShowConfirmAddModal(false)}
        onConfirm={handleConfirmAdd}
        title="Konfirmasi Tambah Satuan Ukuran"
        subtitle="Satuan ukuran baru akan didaftarkan dengan rumus konversi kuantitas fisik BMN."
        variant="primary"
        confirmLabel="Ya, Daftarkan Satuan"
        cancelLabel="Kembali & Cek"
        details={[
          { label: 'Nama Satuan', value: formData.nama },
          { label: 'Kategori / Tipe', value: formData.tipe || 'tunggal' },
          { label: 'Rumus Konversi', value: `1 ${formData.nama} = ${formData.faktorKonversi} ${formData.satuanDasar}` },
          { label: 'Batas Min / Maks', value: `Min: ${formData.rekomendasiStokMin} ${formData.nama} | Maks: ${formData.rekomendasiStokMaks} ${formData.nama}` },
          { label: 'Keterangan', value: formData.keterangan || '-' }
        ]}
      />

      {/* Confirmation Modal for Deleting Satuan */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setSatuanToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Satuan Ukuran"
        subtitle="Apakah Anda yakin ingin menghapus master satuan ini dari sistem?"
        variant="danger"
        confirmLabel="Ya, Hapus Satuan"
        cancelLabel="Batal"
        details={satuanToDelete ? [
          { label: 'ID Satuan', value: satuanToDelete.id },
          { label: 'Nama Satuan', value: satuanToDelete.nama },
          { label: 'Keterangan', value: satuanToDelete.keterangan || '-' }
        ] : []}
      />

      {/* Confirmation Modal for Syncing Standard Presets */}
      <ConfirmationModal
        isOpen={showConfirmSyncModal}
        onClose={() => setShowConfirmSyncModal(false)}
        onConfirm={handleConfirmSyncStandards}
        title="Sinkronisasi Standar Konversi BMN"
        subtitle="Sistem akan melengkapi seluruh master satuan dengan faktor pengali resmi (misal Lusin=12, Rim=500, Kotak=10) dan batas stok rasional tanpa menghapus data Anda."
        variant="primary"
        confirmLabel="Ya, Sinkronkan Sekarang"
        cancelLabel="Batal"
        details={[
          { label: 'Total Satuan Diproses', value: `${enrichedList.length} Master Satuan` },
          { label: 'Cakupan Konversi', value: 'Lusin, Kotak, Box, Pak, Rim, Buah, Unit, Lembar, Rol, Meter, Fol, Botol, Tube, dll.' },
          { label: 'Manfaat', value: 'Mengaktifkan deteksi stok menipis cerdas multi-satuan secara instan' }
        ]}
      />
    </div>
  );
}
