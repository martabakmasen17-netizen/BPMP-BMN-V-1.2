/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Phone, User as UserIcon, MapPin, Building2 } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierViewProps {
  supplierList: Supplier[];
  onAddSupplier: (s: Omit<Supplier, 'id'>) => void;
  onEditSupplier: (id: string, s: Partial<Supplier>) => void;
  onDeleteSupplier: (id: string) => void;
  currentUserRole: string;
}

export default function SupplierView({
  supplierList,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  currentUserRole
}: SupplierViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', kontak: '', telepon: '', alamat: '' });
  const [editFormData, setEditFormData] = useState<Partial<Supplier>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  const handleOpenAdd = () => {
    setFormData({ nama: '', kontak: '', telepon: '', alamat: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddSupplier(formData);
    setShowAddModal(false);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditFormData(s);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditSupplier(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">
          Daftar mitra penyedia/supplier barang kebutuhan kantor BPMP Sumatera Selatan.
        </span>
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Supplier
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supplierList.map(s => (
          <div key={s.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-gray-400">{s.id}</span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 text-sm">{s.nama}</h4>

              {/* Specs */}
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">Kontak Person: <span className="text-gray-900 font-semibold">{s.kontak}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">Telepon: <span className="text-gray-900 font-semibold">{s.telepon}</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium line-clamp-2">Alamat: <span className="text-gray-900">{s.alamat}</span></span>
                </div>
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 hover:bg-slate-50 text-amber-600 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus supplier "${s.nama}"?`)) {
                      onDeleteSupplier(s.id);
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
              <h3 className="font-bold text-gray-900 text-sm">Registrasi Supplier Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Perusahaan / Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT ATK Makmur"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Kontak Person *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama narahubung..."
                  value={formData.kontak}
                  onChange={e => setFormData({ ...formData, kontak: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Nomor Telepon *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812-xxxx-xxxx"
                  value={formData.telepon}
                  onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Alamat kantor / gudang supplier..."
                  value={formData.alamat}
                  onChange={e => setFormData({ ...formData, alamat: e.target.value })}
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
                  Simpan Supplier
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
              <h3 className="font-bold text-gray-900 text-sm">Ubah Supplier ({editFormData.id})</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5 text-xs font-medium text-gray-700">
              <div className="space-y-1">
                <label className="block text-gray-500">Nama Perusahaan / Supplier *</label>
                <input
                  type="text"
                  required
                  value={editFormData.nama}
                  onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Kontak Person *</label>
                <input
                  type="text"
                  required
                  value={editFormData.kontak}
                  onChange={e => setEditFormData({ ...editFormData, kontak: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Nomor Telepon *</label>
                <input
                  type="text"
                  required
                  value={editFormData.telepon}
                  onChange={e => setEditFormData({ ...editFormData, telepon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-500">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={editFormData.alamat}
                  onChange={e => setEditFormData({ ...editFormData, alamat: e.target.value })}
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
