/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  UserCheck, 
  FileText, 
  Phone, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Sparkles,
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Pegawai } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  JABATAN_PRESETS, 
  TUGAS_PRESET_OPTIONS, 
  getDefaultTugasByJabatan, 
  isCustomTugasJabatan,
  getTugasBadgeClass
} from '../utils/pegawaiConstants';

interface PegawaiViewProps {
  pegawaiList: Pegawai[];
  onAddPegawai: (p: Omit<Pegawai, 'id'>) => void;
  onEditPegawai: (id: string, p: Partial<Pegawai>) => void;
  onDeletePegawai: (id: string) => void;
  currentUserRole: string;
}

export default function PegawaiView({
  pegawaiList = [],
  onAddPegawai,
  onEditPegawai,
  onDeletePegawai,
  currentUserRole
}: PegawaiViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTugas, setSelectedFilterTugas] = useState<'all' | 'PJ BMN' | 'Anggota' | 'Magang/KP'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showMatrixInfo, setShowMatrixInfo] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [pegawaiToDelete, setPegawaiToDelete] = useState<Pegawai | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    jabatan: 'Pengolah Data dan Informasi',
    tugas: 'PJ BMN',
    nip: '',
    telepon: '',
    unitKerja: 'Pengelolaan BMN'
  });

  const [editFormData, setEditFormData] = useState<Partial<Pegawai>>({});

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  // Stats calculation
  const totalPegawai = pegawaiList.length;
  const countPjBmn = pegawaiList.filter(p => (p.tugas || '').toLowerCase().includes('pj') || p.jabatan.toLowerCase().includes('pengolah data')).length;
  const countAnggota = pegawaiList.filter(p => (p.tugas || '').toLowerCase().includes('anggota') && !p.jabatan.toLowerCase().includes('magang')).length;
  const countMagang = pegawaiList.filter(p => p.jabatan.toLowerCase().includes('magang') || p.jabatan.toLowerCase().includes('kp') || (p.tugas || '').toLowerCase().includes('magang')).length;

  const handleOpenAdd = () => {
    const defaultJabatan = 'Pengolah Data dan Informasi';
    setFormData({
      nama: '',
      jabatan: defaultJabatan,
      tugas: getDefaultTugasByJabatan(defaultJabatan),
      nip: '',
      telepon: '',
      unitKerja: 'Pengelolaan BMN'
    });
    setShowAddModal(true);
  };

  const handleJabatanChange = (newJabatan: string, isEdit = false) => {
    const autoTugas = getDefaultTugasByJabatan(newJabatan);
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        jabatan: newJabatan,
        tugas: isCustomTugasJabatan(newJabatan) 
          ? (prev.tugas || 'Petugas BMN (Magang/KP)') 
          : autoTugas
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        jabatan: newJabatan,
        tugas: isCustomTugasJabatan(newJabatan) 
          ? 'Petugas BMN & Pengembang Sistem SILAP' 
          : autoTugas
      }));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;
    setShowConfirmAddModal(true);
  };

  const handleConfirmAdd = () => {
    onAddPegawai({
      nama: formData.nama.trim(),
      jabatan: formData.jabatan.trim(),
      tugas: formData.tugas.trim() || getDefaultTugasByJabatan(formData.jabatan),
      nip: formData.nip.trim() || '-',
      telepon: formData.telepon.trim() || '-',
      unitKerja: formData.unitKerja.trim() || 'Pengelolaan BMN'
    });
    setShowConfirmAddModal(false);
    setShowAddModal(false);
  };

  const handleDeleteClick = (p: Pegawai) => {
    setPegawaiToDelete(p);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (pegawaiToDelete) {
      onDeletePegawai(pegawaiToDelete.id);
      setShowConfirmDeleteModal(false);
      setPegawaiToDelete(null);
    }
  };

  const handleOpenEdit = (p: Pegawai) => {
    setEditFormData({
      ...p,
      tugas: p.tugas || getDefaultTugasByJabatan(p.jabatan)
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditPegawai(editFormData.id, {
      ...editFormData,
      nama: editFormData.nama.trim(),
      jabatan: editFormData.jabatan?.trim(),
      tugas: editFormData.tugas?.trim() || getDefaultTugasByJabatan(editFormData.jabatan || ''),
      nip: editFormData.nip?.trim() || '-',
      telepon: editFormData.telepon?.trim() || '-'
    });
    setShowEditModal(false);
  };

  // Filter list
  const filteredPegawai = pegawaiList.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      p.nama.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q) ||
      (p.tugas && p.tugas.toLowerCase().includes(q)) ||
      (p.nip && p.nip.includes(q)) ||
      (p.telepon && p.telepon.includes(q));

    if (!matchesSearch) return false;

    if (selectedFilterTugas === 'PJ BMN') {
      return (p.tugas || '').toLowerCase().includes('pj') || p.jabatan.toLowerCase().includes('pengolah data');
    }
    if (selectedFilterTugas === 'Anggota') {
      return (p.tugas || '').toLowerCase().includes('anggota') && !p.jabatan.toLowerCase().includes('magang');
    }
    if (selectedFilterTugas === 'Magang/KP') {
      return p.jabatan.toLowerCase().includes('magang') || p.jabatan.toLowerCase().includes('kp') || (p.tugas || '').toLowerCase().includes('magang');
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner: Official Structure & Matrix Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Struktur Kepegawaian BMN
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Balai Penjaminan Mutu Pendidikan Prov. Sumsel
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Direktori Pegawai & Petugas BMN
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Daftar resmi pegawai pengelola Barang Milik Negara dengan pembagian <strong>Jabatan (Kolom Kiri)</strong> serta <strong>Tugas dan Tanggung Jawab (Kolom Kanan)</strong>.
              </p>
            </div>

            {/* Quick Actions & Modal Trigger */}
            <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
              <button
                type="button"
                onClick={() => setShowMatrixInfo(prev => !prev)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
                {showMatrixInfo ? 'Tutup Matriks Jabatan' : 'Lihat Matriks Jabatan & Tugas'}
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Pegawai Baru
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Total Pegawai
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{totalPegawai}</span>
                <span className="text-[11px] text-slate-400 font-medium">Orang</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                  PJ BMN
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-300">{countPjBmn}</span>
                <span className="text-[11px] text-amber-200/70 font-medium">Penanggung Jawab</span>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">
                  Anggota Tim
                </span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-300">{countAnggota}</span>
                <span className="text-[11px] text-blue-200/70 font-medium">Pelaksana / Operator</span>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                  Magang / KP
                </span>
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-300">{countMagang}</span>
                <span className="text-[11px] text-indigo-200/70 font-medium">Tugas Fleksibel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Official Jabatan & Tugas Matrix Reference Table */}
      {showMatrixInfo && (
        <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-md">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matriks Standar Jabatan vs Tugas & Tanggung Jawab BMN
                </h4>
                <p className="text-[11px] text-slate-500">
                  Panduan penetapan tugas dan tanggung jawab sesuai struktur resmi BPMP Provinsi Sumatera Selatan.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMatrixInfo(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="p-3 w-1/2">Kolom Kiri: Jabatan Struktural / Fungsional</th>
                  <th className="p-3 w-1/2">Kolom Kanan: Tugas & Tanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {JABATAN_PRESETS.map((jp, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{jp.jabatan}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{jp.deskripsiSingkat}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getTugasBadgeClass(jp.tugasDefault).badge}`}>
                        <span className={`w-2 h-2 rounded-full ${getTugasBadgeClass(jp.tugasDefault).dot}`}></span>
                        {jp.tugasDefault}
                      </span>
                      {jp.isCustomTugas && (
                        <span className="block text-[10px] text-indigo-600 font-semibold mt-1">
                          * Tugas & tanggung jawab dapat diketik bebas / diisi sendiri
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Category Filters, View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, jabatan, NIP, atau tugas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & View Mode */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setSelectedFilterTugas('all')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedFilterTugas === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({pegawaiList.length})
            </button>
            <button
              onClick={() => setSelectedFilterTugas('PJ BMN')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedFilterTugas === 'PJ BMN' ? 'bg-white text-amber-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PJ BMN ({countPjBmn})
            </button>
            <button
              onClick={() => setSelectedFilterTugas('Anggota')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedFilterTugas === 'Anggota' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anggota ({countAnggota})
            </button>
            <button
              onClick={() => setSelectedFilterTugas('Magang/KP')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedFilterTugas === 'Magang/KP' ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Magang/KP ({countMagang})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel Resmi"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Profil"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredPegawai.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Tidak ada pegawai yang sesuai filter</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau ganti filter kategori tugas di atas.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW: Structured exactly as Jabatan (Left) and Tugas (Right) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 text-center w-12">No</th>
                  <th className="p-3.5">Nama Pegawai & NIP</th>
                  <th className="p-3.5">Jabatan (Kolom Kiri)</th>
                  <th className="p-3.5">Tugas & Tanggung Jawab (Kolom Kanan)</th>
                  <th className="p-3.5">Kontak / Telepon</th>
                  {!isReadOnly && <th className="p-3.5 text-center w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPegawai.map((p, idx) => {
                  const tugasVal = p.tugas || getDefaultTugasByJabatan(p.jabatan);
                  const badgeStyle = getTugasBadgeClass(tugasVal);
                  const isPj = tugasVal.toLowerCase().includes('pj') || p.jabatan.toLowerCase().includes('pengolah data');
                  const isMagang = p.jabatan.toLowerCase().includes('magang') || p.jabatan.toLowerCase().includes('kp');

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPj ? 'bg-amber-50/20' : isMagang ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      {/* Number & ID */}
                      <td className="p-3.5 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Name & NIP */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPj ? 'bg-amber-100 text-amber-800' : isMagang ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block leading-snug">
                              {p.nama}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono">{p.id}</span>
                              <span>•</span>
                              <span>NIP: <span className="font-mono text-slate-600 font-semibold">{p.nip || '-'}</span></span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Kiri: Jabatan */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block text-xs">
                            {p.jabatan}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {p.unitKerja || 'Tim Pengelolaan BMN'}
                          </span>
                        </div>
                      </td>

                      {/* Kolom Kanan: Tugas dan Tanggung Jawab */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${badgeStyle.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`}></span>
                            {tugasVal}
                          </span>
                          {isMagang && (
                            <span className="block text-[10px] text-indigo-600 font-medium">
                              Praktik Kerja Lapangan
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="p-3.5">
                        {p.telepon && p.telepon !== '-' ? (
                          <a 
                            href={`https://wa.me/${p.telepon.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-green-600 font-mono text-[11px] transition-colors"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.telepon}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      {!isReadOnly && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg cursor-pointer transition-colors"
                              title="Ubah Data Pegawai"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer transition-colors"
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPegawai.map(p => {
            const tugasVal = p.tugas || getDefaultTugasByJabatan(p.jabatan);
            const badgeStyle = getTugasBadgeClass(tugasVal);
            const isPj = tugasVal.toLowerCase().includes('pj') || p.jabatan.toLowerCase().includes('pengolah data');
            const isMagang = p.jabatan.toLowerCase().includes('magang') || p.jabatan.toLowerCase().includes('kp');

            return (
              <div 
                key={p.id} 
                className={`bg-white p-5 border-2 rounded-2xl shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isPj ? 'border-amber-200' : isMagang ? 'border-indigo-200' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isPj ? 'bg-amber-100 text-amber-800' : isMagang ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {p.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">{p.id}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate">{p.nama}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Columns visualization: Jabatan (Left) and Tugas (Right) */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Jabatan
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 leading-tight">
                        {p.jabatan}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Tugas & Tanggung Jawab
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold mt-0.5 border ${badgeStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                        {tugasVal}
                      </span>
                    </div>
                  </div>

                  {/* NIP and Phone */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> NIP:
                      </span>
                      <span className="font-mono font-bold text-slate-800">{p.nip || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Telepon / WA:
                      </span>
                      {p.telepon && p.telepon !== '-' ? (
                        <a 
                          href={`https://wa.me/${p.telepon.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          {p.telepon}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p)}
                      className="px-2.5 py-1 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD PEGAWAI MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Tambah Pegawai BMN Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tetapkan Jabatan (Kolom Kiri) dan Tugas & Tanggung Jawab (Kolom Kanan)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-4 text-xs font-medium text-slate-700 overflow-y-auto max-h-[65vh]">
                {/* Nama Pegawai */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Nama Lengkap Pegawai / Petugas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Roni Setiawan, S.Sos."
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all font-semibold text-slate-900 text-xs"
                  />
                </div>

                {/* Kolom Kiri: Jabatan */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                      Jabatan (Kolom Kiri) *
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Sesuai Struktur Resmi
                    </span>
                  </div>
                  <select
                    value={formData.jabatan}
                    onChange={e => handleJabatanChange(e.target.value, false)}
                    className="w-full px-3.5 py-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none transition-all font-bold text-slate-900 text-xs"
                  >
                    {JABATAN_PRESETS.map((jp, i) => (
                      <option key={i} value={jp.jabatan}>
                        {jp.jabatan} {jp.isCustomTugas ? '(Magang/KP - Tugas Bebas Diisi)' : `→ Default: ${jp.tugasDefault}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kolom Kanan: Tugas dan Tanggung Jawab */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Tugas & Tanggung Jawab (Kolom Kanan) *
                    </label>
                    {isCustomTugasJabatan(formData.jabatan) ? (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        Mode Bebas Diisi Sendiri (Magang/KP)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Otomatis Terhubung
                      </span>
                    )}
                  </div>

                  {/* Input Tugas & Tanggung Jawab: Free text if Magang/KP, or customizable */}
                  <input
                    type="text"
                    required
                    placeholder={
                      isCustomTugasJabatan(formData.jabatan)
                        ? "Ketik tugas & tanggung jawab magang (contoh: Petugas BMN / Pengembang Aplikasi)"
                        : "Tugas dan Tanggung Jawab BMN"
                    }
                    value={formData.tugas}
                    onChange={e => setFormData({ ...formData, tugas: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:outline-none transition-all text-xs font-bold ${
                      isCustomTugasJabatan(formData.jabatan)
                        ? 'bg-white border-indigo-300 focus:ring-indigo-600 text-indigo-950 shadow-2xs'
                        : 'bg-white border-slate-200 focus:ring-blue-600 text-slate-900'
                    }`}
                  />

                  {/* Quick Select presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                    {['PJ BMN', 'Anggota', 'Petugas BMN (Magang/KP)'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({ ...formData, tugas: opt })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                          formData.tugas === opt 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NIP and Telepon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      NIP (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      placeholder="18 digit / '-' jika Magang"
                      value={formData.nip}
                      onChange={e => setFormData({ ...formData, nip: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all font-mono text-slate-900 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812-xxxx-xxxx"
                      value={formData.telepon}
                      onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all font-mono text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-600 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PEGAWAI MODAL */}
      {/* ========================================================================= */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Ubah Data Pegawai BMN
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {editFormData.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-4 text-xs font-medium text-slate-700 overflow-y-auto max-h-[65vh]">
                {/* Nama Pegawai */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Nama Lengkap Pegawai *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nama || ''}
                    onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all font-semibold text-slate-900 text-xs"
                  />
                </div>

                {/* Kolom Kiri: Jabatan */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Jabatan (Kolom Kiri) *
                  </label>
                  <select
                    value={editFormData.jabatan || 'Pengolah Data dan Informasi'}
                    onChange={e => handleJabatanChange(e.target.value, true)}
                    className="w-full px-3.5 py-2.5 bg-amber-50/30 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-900 text-xs"
                  >
                    {JABATAN_PRESETS.map((jp, i) => (
                      <option key={i} value={jp.jabatan}>
                        {jp.jabatan} {jp.isCustomTugas ? '(Magang/KP - Tugas Bebas Diisi)' : `→ Default: ${jp.tugasDefault}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kolom Kanan: Tugas dan Tanggung Jawab */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Tugas & Tanggung Jawab (Kolom Kanan) *
                    </label>
                    {isCustomTugasJabatan(editFormData.jabatan || '') && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        Mode Bebas Diisi
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Tugas dan Tanggung Jawab"
                    value={editFormData.tugas || ''}
                    onChange={e => setEditFormData({ ...editFormData, tugas: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all text-xs font-bold text-slate-900"
                  />

                  {/* Quick Select presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                    {['PJ BMN', 'Anggota', 'Petugas BMN (Magang/KP)'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, tugas: opt })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                          editFormData.tugas === opt 
                            ? 'bg-amber-500 text-white border-amber-500' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NIP & Telepon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      NIP
                    </label>
                    <input
                      type="text"
                      value={editFormData.nip || ''}
                      onChange={e => setEditFormData({ ...editFormData, nip: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all font-mono text-slate-900 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={editFormData.telepon || ''}
                      onChange={e => setEditFormData({ ...editFormData, telepon: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all font-mono text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer text-slate-600 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Adding Pegawai */}
      <ConfirmationModal
        isOpen={showConfirmAddModal}
        onClose={() => setShowConfirmAddModal(false)}
        onConfirm={handleConfirmAdd}
        title="Konfirmasi Registrasi Pegawai BMN"
        subtitle="Pegawai baru akan didaftarkan ke dalam direktori resmi petugas BMN BPMP Sumsel."
        variant="primary"
        confirmLabel="Ya, Daftarkan Pegawai"
        cancelLabel="Kembali & Periksa"
        details={[
          { label: 'Nama Lengkap', value: formData.nama },
          { label: 'Jabatan (Kolom Kiri)', value: formData.jabatan },
          { label: 'Tugas & Tanggung Jawab (Kolom Kanan)', value: formData.tugas || getDefaultTugasByJabatan(formData.jabatan) },
          { label: 'NIP', value: formData.nip || '-' },
          { label: 'Nomor Telepon', value: formData.telepon || '-' }
        ]}
      />

      {/* Confirmation Modal for Deleting Pegawai */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal && !!pegawaiToDelete}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setPegawaiToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Data Pegawai"
        subtitle={pegawaiToDelete ? `Apakah Anda yakin ingin menghapus "${pegawaiToDelete.nama}" dari direktori?` : ''}
        variant="danger"
        confirmLabel="Ya, Hapus Pegawai"
        cancelLabel="Batal"
        warningNote="Peringatan: Data pegawai ini akan dihapus dari direktori master petugas internal."
        details={pegawaiToDelete ? [
          { label: 'ID Pegawai', value: pegawaiToDelete.id },
          { label: 'Nama Lengkap', value: pegawaiToDelete.nama },
          { label: 'Jabatan', value: pegawaiToDelete.jabatan },
          { label: 'Tugas & Tanggung Jawab', value: pegawaiToDelete.tugas || '-' },
          { label: 'NIP', value: pegawaiToDelete.nip || '-' }
        ] : []}
      />
    </div>
  );
}
