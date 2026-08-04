/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Scale } from 'lucide-react';
import { Satuan } from '../types';

interface SatuanViewProps {
  satuanList: Satuan[];
  onAddSatuan: (s: Omit<Satuan, 'id'>) => void;
  onEditSatuan: (id: string, s: Partial<Satuan>) => void;
  onDeleteSatuan: (id: string) => void;
  currentUserRole: string;
}

export default function SatuanView({
  satuanList,
  onAddSatuan,
  onEditSatuan,
  onDeleteSatuan,
  currentUserRole
}: SatuanViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', keterangan: '' });
  const [editFormData, setEditFormData] = useState<Partial<Satuan>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  const handleOpenAdd = () => {
    setFormData({ nama: '', keterangan: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddSatuan(formData);
    setShowAddModal(false);
  };

  const handleOpenEdit = (s: Satuan) => {
    setEditFormData(s);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditSatuan(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">
          Daftar satuan pengukuran / ukuran kuantitas fisik item barang dalam gudang BMN.
        </span>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Satuan
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {satuanList.map(s => (
          <div key={s.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono text-[10px] font-bold text-gray-400">{s.id}</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">{s.nama}</h4>
              <p className="text-gray-500 text-[11px] leading-tight min-h-[30px]">
                {s.keterangan || 'Tidak ada keterangan tambahan.'}
              </p>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end gap-1 mt-3 pt-2.5 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1 hover:bg-slate-50 text-amber-600 rounded cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus satuan "${s.nama}"?`)) {
                      onDeleteSatuan(s.id);
                    }
                  }}
                  className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 text-sm">Tambah Satuan Ukuran</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Satuan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rim, Box, Pcs, Dus..."
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Contoh: Satuan kuantitas untuk kertas..."
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
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
                  Simpan Satuan
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
              <h3 className="font-bold text-gray-900 text-sm">Ubah Satuan Ukuran</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Satuan *</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama}
                  onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  value={editFormData.keterangan}
                  onChange={e => setEditFormData({ ...editFormData, keterangan: e.target.value })}
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
