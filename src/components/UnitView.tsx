/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Building, ShieldCheck } from 'lucide-react';
import { Unit, Pegawai } from '../types';

interface UnitViewProps {
  unitList: Unit[];
  onAddUnit: (u: Omit<Unit, 'id'>) => void;
  onEditUnit: (id: string, u: Partial<Unit>) => void;
  onDeleteUnit: (id: string) => void;
  currentUserRole: string;
  pegawaiList: Pegawai[];
}

export default function UnitView({
  unitList,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  currentUserRole,
  pegawaiList
}: UnitViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', penanggungJawab: '', keterangan: '' });
  const [editFormData, setEditFormData] = useState<Partial<Unit>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  const handleOpenAdd = () => {
    setFormData({ 
      nama: '', 
      penanggungJawab: '', 
      keterangan: '' 
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddUnit(formData);
    setShowAddModal(false);
  };

  const handleOpenEdit = (u: Unit) => {
    setEditFormData(u);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditUnit(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">
          Daftar Unit Kerja / Seksi internal BPMP Provinsi Sumatera Selatan selaku penerima distribusi barang.
        </span>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Unit Kerja
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {unitList.map(u => (
          <div key={u.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                    <Building className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-gray-400">{u.id}</span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 text-sm">{u.nama}</h4>

              <div className="space-y-2 text-xs">
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mt-1">
                  {u.keterangan || 'Tidak ada keterangan tambahan.'}
                </p>
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="p-1.5 hover:bg-slate-50 text-amber-600 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus unit kerja "${u.nama}"?`)) {
                      onDeleteUnit(u.id);
                    }
                  }}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
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
              <h3 className="font-bold text-gray-900 text-sm">Tambah Unit Kerja Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Unit Kerja / Divisi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Seksi Penjaminan Mutu"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Tugas Pokok / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat seksi kerja..."
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
                  Simpan Unit Kerja
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
              <h3 className="font-bold text-gray-900 text-sm">Ubah Unit Kerja ({editFormData.id})</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Unit Kerja / Divisi *</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama}
                  onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Tugas Pokok / Keterangan</label>
                <textarea
                  rows={2}
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
