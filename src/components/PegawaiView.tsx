/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Contact, FileText, Phone, Award } from 'lucide-react';
import { Pegawai } from '../types';

interface PegawaiViewProps {
  pegawaiList: Pegawai[];
  onAddPegawai: (p: Omit<Pegawai, 'id'>) => void;
  onEditPegawai: (id: string, p: Partial<Pegawai>) => void;
  onDeletePegawai: (id: string) => void;
  currentUserRole: string;
}

export default function PegawaiView({
  pegawaiList,
  onAddPegawai,
  onEditPegawai,
  onDeletePegawai,
  currentUserRole
}: PegawaiViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', jabatan: '', nip: '', telepon: '' });
  const [editFormData, setEditFormData] = useState<Partial<Pegawai>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  const handleOpenAdd = () => {
    setFormData({ nama: '', jabatan: 'Petugas BMN', nip: '', telepon: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddPegawai(formData);
    setShowAddModal(false);
  };

  const handleOpenEdit = (p: Pegawai) => {
    setEditFormData(p);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditPegawai(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  // Filter list
  const filteredPegawai = pegawaiList.filter(p => 
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nip && p.nip.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, jabatan, atau NIP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        
        {!isReadOnly && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Pegawai BMN
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPegawai.length === 0 ? (
          <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-200 shadow-sm col-span-full">
            Tidak ada data pegawai BMN ditemukan
          </div>
        ) : (
          filteredPegawai.map(p => (
            <div key={p.id} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                      <Contact className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-gray-400">{p.id}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                    {p.jabatan}
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-sm leading-snug">{p.nama}</h4>

                <div className="space-y-1.5 text-xs text-gray-600">
                  {p.nip && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>NIP: <span className="text-gray-900 font-mono text-[11px]">{p.nip}</span></span>
                    </div>
                  )}
                  {p.telepon && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>Telp: <span className="text-gray-900">{p.telepon}</span></span>
                    </div>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 hover:bg-slate-50 text-amber-600 rounded-lg cursor-pointer"
                    title="Ubah Pegawai"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus pegawai "${p.nama}"?`)) {
                        onDeletePegawai(p.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                    title="Hapus Pegawai"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">Tambah Pegawai BMN</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs font-medium text-gray-700 overflow-y-auto max-h-[60vh]">
                <div className="space-y-1">
                  <label className="block text-gray-500">Nama Pegawai / Petugas *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Roni Setiawan"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-gray-500">Jabatan / Peran Sistem *</label>
                  <select
                    value={formData.jabatan}
                    onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Petugas BMN">Petugas BMN</option>
                    <option value="Staf BMN">Staf BMN</option>
                    <option value="Staf Administrasi BMN">Staf Administrasi BMN</option>
                    <option value="Staf Inventarisasi BMN">Staf Inventarisasi BMN</option>
                    <option value="Kepala Subbagian Umum">Kepala Subbagian Umum</option>
                    <option value="Pimpinan / Kepala BPMP">Pimpinan / Kepala BPMP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-500">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 198804152014021003"
                    value={formData.nip}
                    onChange={e => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-500">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    value={formData.telepon}
                    onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-100 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Tambah Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">Ubah Pegawai BMN</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-3.5 text-xs font-medium text-gray-700 overflow-y-auto max-h-[60vh]">
                <div className="space-y-1">
                  <label className="block text-gray-500">Nama Pegawai / Petugas *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nama}
                    onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-gray-500">Jabatan / Peran Sistem *</label>
                  <select
                    value={editFormData.jabatan}
                    onChange={e => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Petugas BMN">Petugas BMN</option>
                    <option value="Staf BMN">Staf BMN</option>
                    <option value="Staf Administrasi BMN">Staf Administrasi BMN</option>
                    <option value="Staf Inventarisasi BMN">Staf Inventarisasi BMN</option>
                    <option value="Kepala Subbagian Umum">Kepala Subbagian Umum</option>
                    <option value="Pimpinan / Kepala BPMP">Pimpinan / Kepala BPMP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-500">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    value={editFormData.nip || ''}
                    onChange={e => setEditFormData({ ...editFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-500">Nomor Telepon</label>
                  <input
                    type="text"
                    value={editFormData.telepon || ''}
                    onChange={e => setEditFormData({ ...editFormData, telepon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-100 cursor-pointer text-gray-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
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
