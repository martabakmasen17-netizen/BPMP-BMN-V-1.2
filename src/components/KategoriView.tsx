/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, FolderTree, QrCode, Printer, PackageSearch, Download } from 'lucide-react';
import { Kategori, Barang } from '../types';

interface KategoriViewProps {
  kategoriList: Kategori[];
  barang: Barang[];
  onAddKategori: (k: Omit<Kategori, 'id'> & { id?: string }) => void;
  onEditKategori: (id: string, k: Partial<Kategori>) => void;
  onDeleteKategori: (id: string) => void;
  currentUserRole: string;
}

export default function KategoriView({
  kategoriList,
  barang,
  onAddKategori,
  onEditKategori,
  onDeleteKategori,
  currentUserRole
}: KategoriViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedCatQr, setSelectedCatQr] = useState<Kategori | null>(null);
  const [selectedCatItems, setSelectedCatItems] = useState<Kategori | null>(null);

  const [formData, setFormData] = useState({ id: '', nama: '', deskripsi: '' });
  const [editFormData, setEditFormData] = useState<Partial<Kategori>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  const getBarangCount = (kategoriNama: string, kategoriId?: string) => {
    return barang.filter(b => b.kategori === kategoriNama || b.kategoriId === kategoriId).length;
  };

  const getItemsForKategori = (cat: Kategori) => {
    return barang.filter(b => b.kategori === cat.nama || b.kategoriId === cat.id);
  };

  const handleOpenAdd = () => {
    setFormData({ id: '', nama: '', deskripsi: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddKategori({
      id: formData.id ? formData.id.trim() : undefined,
      nama: formData.nama,
      deskripsi: formData.deskripsi
    });
    setShowAddModal(false);
  };

  const handleOpenEdit = (k: Kategori) => {
    setEditFormData(k);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditKategori(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  const handlePrintBarcode = (cat: Kategori) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const qrUrl = cat.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${cat.id}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Barcode Kategori - ${cat.nama}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; }
            .card { border: 2px dashed #333; padding: 24px; border-radius: 16px; width: 280px; }
            h2 { margin: 8px 0 4px; font-size: 18px; color: #111; }
            p { margin: 2px 0; color: #555; font-size: 12px; }
            .code { font-family: monospace; font-weight: bold; font-size: 16px; background: #eee; padding: 4px 12px; border-radius: 6px; display: inline-block; margin-top: 8px; }
            img { width: 180px; height: 180px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <p>BARCODE / QR KATEGORI BMN</p>
            <h2>${cat.nama}</h2>
            <img src="${qrUrl}" alt="QR Code ${cat.id}" />
            <div class="code">KODE KATEGORI: ${cat.id}</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Klasifikasi Kategori & Barcode Kategori</h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Barcode/QR Code dicetak per kategori (contoh: Kode 1010301001 untuk ALAT TULIS).
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        )}
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kategoriList.map(cat => {
          const count = getBarangCount(cat.nama, cat.id);
          const qrUrl = cat.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${cat.id}`;
          return (
            <div key={cat.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Kode Kategori</div>
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{cat.id}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCatItems(cat)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <PackageSearch className="w-3 h-3 text-blue-600" />
                    {count} Barang
                  </button>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{cat.nama}</h4>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{cat.deskripsi || 'Tidak ada deskripsi.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCatQr(cat);
                    setShowQrModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" /> Barcode Kategori
                </button>

                {!isReadOnly && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg cursor-pointer transition-colors"
                      title="Ubah Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (count > 0) {
                          alert(`Tidak dapat menghapus. Ada ${count} item barang menggunakan kategori ini.`);
                          return;
                        }
                        if (confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.nama}"?`)) {
                          onDeleteKategori(cat.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR / BARCODE MODAL */}
      {showQrModal && selectedCatQr && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden text-center p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-left">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Barcode/QR Kategori</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedCatQr.nama}</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
              <img
                src={selectedCatQr.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedCatQr.id}`}
                alt={selectedCatQr.nama}
                className="w-48 h-48 mx-auto object-contain rounded-lg shadow-sm"
              />
              <div className="mt-3 bg-white py-1.5 px-3 rounded-lg border border-slate-200 font-mono text-xs font-bold text-gray-800">
                KODE: {selectedCatQr.id}
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => handlePrintBarcode(selectedCatQr)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak Barcode Kategori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ITEMS IN CATEGORY MODAL */}
      {selectedCatItems && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  KODE: {selectedCatItems.id}
                </span>
                <h3 className="font-bold text-gray-900 text-sm mt-0.5">Daftar Barang - {selectedCatItems.nama}</h3>
              </div>
              <button onClick={() => setSelectedCatItems(null)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {getItemsForKategori(selectedCatItems).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs font-medium">
                  Belum ada barang terdaftar dalam kategori ini.
                </div>
              ) : (
                getItemsForKategori(selectedCatItems).map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[10px]">
                          Kode: {b.id}
                        </span>
                        <span className="font-bold text-gray-900">{b.nama}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Satuan: {b.satuan} | Lokasi: {b.lokasiRak} | Stok: <span className="font-bold text-slate-800">{b.stokSekarang}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-sm">Tambah Kategori Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Kode Kategori (Opsional / Otomatis)</label>
                <input
                  type="text"
                  placeholder="Contoh: 1010301006"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400">Jika dikosongkan, kode akan dibuat secara otomatis.</span>
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ALAT TULIS, TINTA STEMPEL..."
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan klasifikasi..."
                  value={formData.deskripsi}
                  onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Tambah Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-sm">Edit Kategori ({editFormData.id})</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama || ''}
                  onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={editFormData.deskripsi || ''}
                  onChange={e => setEditFormData({ ...editFormData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
