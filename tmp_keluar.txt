/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, Check, X, ShieldAlert, Clock, AlertTriangle, Building, FileSpreadsheet, QrCode, FolderTree, Package } from 'lucide-react';
import { Barang, Kategori, Unit, BarangKeluar, Pegawai } from '../types';
import QRScannerModal from './QRScannerModal';

interface TransaksiKeluarViewProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  unitList: Unit[];
  transaksiList: BarangKeluar[];
  onProcessTransaksi: (t: Omit<BarangKeluar, 'id' | 'tanggal' | 'statusPersetujuan'>) => void;
  onApproveRejectTransaksi: (id: string, status: 'Disetujui' | 'Ditolak', notes?: string) => void;
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
  currentUserRole,
  quickAddBarangId,
  clearQuickAdd,
  pegawaiList
}: TransaksiKeluarViewProps) {
  // Category & Item State
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>(() => {
    if (quickAddBarangId) {
      const b = barangList.find(x => x.id === quickAddBarangId);
      if (b) return b.kategoriId || kategoriList.find(k => k.nama === b.kategori)?.id || (kategoriList[0]?.id || '');
    }
    return kategoriList[0]?.id || '';
  });

  const selectedCategoryObj = kategoriList.find(k => k.id === selectedKategoriId || k.nama === selectedKategoriId);

  // Filter items by category
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

  const [jumlah, setJumlah] = useState<number>(1);
  const [selectedUnitId, setSelectedUnitId] = useState(unitList[0]?.nama || '');
  const [petugas, setPetugas] = useState(() => pegawaiList?.[0]?.nama || 'Roni Setiawan');
  const [keperluan, setKeperluan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState('');

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
      setSelectedBarangId(quickAddBarangId);
    }
  }, [quickAddBarangId]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isReadOnly = currentUserRole === 'Viewer';
  const isApprover = currentUserRole === 'Kepala Subbagian' || currentUserRole === 'Administrator';

  const selectedItem = barangList.find(b => b.id === selectedBarangId);

  const handleJumlahChange = (val: number) => {
    setJumlah(val);
    setValidationError('');
    if (selectedItem && val > selectedItem.stokSekarang) {
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
  };

  // Group pending requests
  const pendingRequests = transaksiList.filter(t => t.statusPersetujuan === 'Pending');
  const finalizedRequests = transaksiList.filter(t => t.statusPersetujuan !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Confirmation Popup Modal */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                KONFIRMASI DISTRIBUSI BARANG KELUAR
              </span>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-slate-700">
              <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                <strong>PENTING:</strong> Menekan tombol "Ya, Konfirmasi" akan langsung mengurangi stok barang persediaan di sistem secara permanen. Pastikan data di bawah ini sudah benar.
              </div>

              <div className="space-y-3">
                {/* Detail Form List */}
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Nama Barang</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedItem.nama} ({selectedItem.id})</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Volume Keluar</span>
                  <span className="col-span-2 font-bold text-red-600">-{jumlah} {selectedItem.satuan}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Stok Sisa Nanti</span>
                  <span className="col-span-2 font-semibold text-gray-800">
                    {selectedItem.stokSekarang - jumlah} {selectedItem.satuan}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Unit Penerima</span>
                  <span className="col-span-2 font-bold text-gray-900">{selectedUnitId}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Petugas Penyerah</span>
                  <span className="col-span-2 font-semibold text-gray-800">{petugas}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                  <span className="text-gray-400">Tujuan Keperluan</span>
                  <span className="col-span-2 text-gray-900 italic font-medium">"{keperluan}"</span>
                </div>
                {catatan && (
                  <div className="grid grid-cols-3 py-1.5 border-b border-gray-100">
                    <span className="text-gray-400">Catatan Ekstra</span>
                    <span className="col-span-2 text-gray-600">{catatan}</span>
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
                Batal / Perbaiki Form
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Ya, Data Sudah Benar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Core Layout */}
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
              handleBarangChange(item.id);
            }
          }}
          barangList={barangList}
          kategoriList={kategoriList}
        />

        {/* Form panel */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-1 h-fit">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <ArrowUpRight className="w-4.5 h-4.5 text-red-500 bg-red-50 p-0.5 rounded" />
              Input Pengeluaran Barang Keluar
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
          </div>

          {isReadOnly ? (
            <div className="p-4 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
              Role Anda ({currentUserRole}) tidak memiliki otorisasi untuk mengajukan pengeluaran barang.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
              {/* STEP 1: KATEGORI BARANG */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-bold flex items-center gap-1">
                  <FolderTree className="w-3.5 h-3.5 text-red-600" />
                  1. Pilih Kategori Barang *
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={selectedKategoriId}
                    onChange={e => handleKategoriChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-red-200 bg-red-50/20 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none min-w-0 font-medium text-gray-900"
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
                    className="flex-shrink-0 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
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
                      <option key={`${b.id}-${b.kategoriId}-${idx}`} value={b.id} disabled={b.stokSekarang === 0}>
                        [{b.id}] {b.nama} (Stok: {b.stokSekarang} {b.satuan}) {b.stokSekarang === 0 ? '[KOSONG]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Specs display and stock warnings */}
              {selectedItem && (
                <div className={`p-2.5 rounded-xl text-[11px] border ${selectedItem.stokSekarang < selectedItem.stokMin ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-gray-100 text-gray-600'}`}>
                  <div className="grid grid-cols-2 gap-2 font-medium">
                    <div>
                      <span>Tersedia: </span>
                      <span className="font-bold text-gray-900">{selectedItem.stokSekarang} {selectedItem.satuan}</span>
                    </div>
                    <div>
                      <span>Lokasi Rak: </span>
                      <span className="font-bold text-gray-900">{selectedItem.lokasiRak}</span>
                    </div>
                  </div>
                  {selectedItem.stokSekarang < selectedItem.stokMin && (
                    <div className="mt-1.5 flex items-start gap-1 font-bold text-[10px] text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Stok item ini kritis (dibawah minimum {selectedItem.stokMin})!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Volume */}
              <div className="space-y-1">
                <label className="block text-gray-500">Jumlah Volume Keluar *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={jumlah}
                    onChange={e => handleJumlahChange(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                      validationError ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-700' : 'border-gray-200 focus:ring-blue-600'
                    }`}
                  />
                  <span className="px-3.5 py-2 bg-slate-100 border border-gray-200 text-gray-500 font-bold rounded-xl flex items-center justify-center">
                    {selectedItem?.satuan || 'Pcs'}
                  </span>
                </div>
                {validationError && (
                  <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1">
                    <X className="w-3.5 h-3.5" /> {validationError}
                  </p>
                )}
              </div>

              {/* Unit kerja */}
              <div className="space-y-1">
                <label className="block text-gray-500">Unit Kerja Penerima *</label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                <label className="block text-gray-500">Petugas Penanggung Jawab BMN *</label>
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

              {/* Purpose */}
              <div className="space-y-1">
                <label className="block text-gray-500">Keperluan Penggunaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cetak raport pendidikan / rapat evaluasi"
                  value={keperluan}
                  onChange={e => setKeperluan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-gray-500">Catatan Pengeluaran</label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan catatan kondisi pengiriman atau no nota surat keluar..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!!validationError || !selectedBarangId}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                Proses Distribusi Barang <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Transactions lists */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
          {/* Pending permohonan section for standard workers */}
          {!isApprover && pendingRequests.length > 0 && (
            <div className="border border-amber-100 bg-amber-50/40 p-4 rounded-xl">
              <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Permohonan Pengeluaran Anda Menunggu Persetujuan ({pendingRequests.length})
              </h4>
              <div className="divide-y divide-amber-100 text-[11px]">
                {pendingRequests.map((p, idx) => (
                  <div key={`${p.id}_${idx}`} className="py-2.5 flex items-center justify-between text-slate-700">
                    <div>
                      <span className="font-bold text-gray-900">{p.namaBarang}</span>
                      <span className="text-[10px] text-gray-400 block">Unit: {p.unitId} • Keperluan: {p.keperluan}</span>
                    </div>
                    <span className="font-bold text-red-600">-{p.jumlah} Pcs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Master logs list */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Daftar Distribusi Barang Keluar</span>
              <span className="text-xs text-gray-400 font-semibold">{finalizedRequests.length} Transaksi</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">ID Transaksi / Tanggal</th>
                    <th className="p-3">Barang</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3">Unit Penerima</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {finalizedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        Belum ada transaksi barang keluar difinalisasi (Disetujui/Ditolak)
                      </td>
                    </tr>
                  ) : (
                    finalizedRequests.map((t, idx) => (
                      <tr key={`${t.id}_${idx}`} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-gray-900 block">{t.id}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(t.tanggal).toLocaleDateString('id-ID')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{t.namaBarang}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {t.barangId}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg">
                            -{t.jumlah}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-700 font-bold block">{t.unitId}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 truncate max-w-[150px]">Tujuan: {t.keperluan}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.statusPersetujuan === 'Disetujui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {t.statusPersetujuan === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
