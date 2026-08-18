/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { 
  Users, 
  Check, 
  X, 
  UserCheck, 
  Database, 
  TrendingUp, 
  FileSpreadsheet, 
  AlertCircle, 
  Clock, 
  Trash2,
  FileDown,
  CloudLightning,
  Settings,
  Edit,
  Save,
  Download
} from 'lucide-react';
import { UserAccount, Barang, Riwayat } from '../types';
import { getDefaultTugasByJabatan, getTugasBadgeClass } from '../utils/pegawaiConstants';

interface AdminControlViewProps {
  accounts: UserAccount[];
  onApproveAccount: (username: string) => void;
  onRejectAccount: (username: string) => void;
  onDeleteAccount: (username: string) => void;
  onUpdateAccount?: (username: string, updatedAccount: Partial<UserAccount>) => void;
  onUpdatePassword?: (username: string, newPassword: string) => void;
  onMigrateBackup?: () => void;
  barangList: Barang[];
  riwayatList: Riwayat[];
  settings: any;
}

export default function AdminControlView({
  accounts = [],
  onApproveAccount,
  onRejectAccount,
  onDeleteAccount,
  onUpdateAccount,
  onUpdatePassword,
  onMigrateBackup,
  barangList = [],
  riwayatList = [],
  settings = {}
}: AdminControlViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'akun' | 'statistik' | 'integrasi'>('akun');
  
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserAccount>>({});

  // Modal States
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAdminProtectModal, setShowAdminProtectModal] = useState<boolean>(false);
  const [showMigrateConfirmModal, setShowMigrateConfirmModal] = useState<boolean>(false);

  // Helper function to safely format dates without throwing RangeError
  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID');
    } catch (e) {
      return '-';
    }
  };

  // Safe arrays
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeBarangList = Array.isArray(barangList) ? barangList : [];
  const safeRiwayatList = Array.isArray(riwayatList) ? riwayatList : [];
  const safeSettings = settings || {};

  // Stats calculation
  const pendingAccounts = safeAccounts.filter(a => a && a.status === 'Pending');
  const approvedAccounts = safeAccounts.filter(a => a && a.status === 'Disetujui');
  const activeOrRejectedAccounts = safeAccounts.filter(a => a && a.status !== 'Pending');
  
  const totalItems = safeBarangList.length;
  const lowStockItems = safeBarangList.filter(b => b && Number(b.stokSekarang || 0) < Number(b.stokMin || 0)).length;
  const outOfStockItems = safeBarangList.filter(b => b && Number(b.stokSekarang || 0) === 0).length;

  const totalInbound = safeRiwayatList.filter(r => r && r.tipe === 'Masuk').length;
  const totalOutbound = safeRiwayatList.filter(r => r && r.tipe === 'Keluar').length;

  const handleStartEdit = (acc: UserAccount) => {
    setEditingUser(acc.username);
    setEditFormData({
      nama: acc.nama,
      nip: acc.nip,
      jabatan: acc.jabatan,
      tugas: acc.tugas || getDefaultTugasByJabatan(acc.jabatan),
      telepon: acc.telepon,
      password: acc.password,
      status: acc.status,
      role: acc.role
    });
  };

  const handleSaveEdit = (username: string) => {
    if (onUpdateAccount) {
      onUpdateAccount(username, editFormData);
    }
    setEditingUser(null);
    setEditFormData({});
  };

  const handleDeleteAccountClick = (username: string) => {
    if (username === 'admin') {
      setShowAdminProtectModal(true);
      return;
    }
    setUserToDelete(username);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      onDeleteAccount(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleConfirmMigrate = () => {
    // Create a simulated downloadable backup file (CSV format combined)
    let csvContent = "Data Backup Logistik BMN - " + new Date().toLocaleDateString('id-ID') + "\n\n";
    csvContent += "RIWAYAT TRANSAKSI:\n";
    safeRiwayatList.forEach(r => {
      csvContent += `${r.tanggal},${r.tipe},${r.namaBarang},${r.jumlah},${r.petugas},${r.keterangan}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Backup_BMN_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onMigrateBackup) {
      onMigrateBackup();
    }
    setShowMigrateConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Subtabs */}
      <div className="bg-white p-5 md:p-6 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-5 mb-5">
          <div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Administrator Control Center
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 mt-2">Panel Manajemen Sistem</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
              Kelola otorisasi akun pegawai, tinjau parameter database, serta tangani integrasi dan pencadangan (backup) log transaksi secara aman.
            </p>
          </div>
          
          {/* Subpage tabs */}
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl text-xs font-semibold self-start shrink-0">
            <button
              onClick={() => setActiveSubTab('akun')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'akun' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> Akun Pegawai {pendingAccounts.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('statistik')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'statistik' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Ringkasan Mutasi
            </button>
            <button
              onClick={() => setActiveSubTab('integrasi')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'integrasi' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" /> Backup & Migrasi
            </button>
          </div>
        </div>

        <div className="text-xs">
          {activeSubTab === 'akun' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <UserCheck className="w-4.5 h-4.5 text-indigo-500" />
                    Permohonan Pendaftaran Akun
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold ml-1">
                      {pendingAccounts.length} Menunggu
                    </span>
                  </h3>
                </div>
                {pendingAccounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingAccounts.map((acc, idx) => {
                      const usernameStr = String(acc?.username || `pending-${idx}`);
                      const namaStr = String(acc?.nama || 'Tanpa Nama');
                      const jabatanStr = String(acc?.jabatan || '-');
                      const tugasStr = String(acc?.tugas || getDefaultTugasByJabatan(jabatanStr));
                      const nipStr = String(acc?.nip || '-');
                      const teleponStr = String(acc?.telepon || '-');
                      const regAtStr = String(acc?.registeredAt || '');
                      const badgeStyle = getTugasBadgeClass(tugasStr);

                      return (
                        <div key={usernameStr} className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-3 h-3" /> Menunggu Konfirmasi
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">
                                Daftar: {formatDateSafe(regAtStr)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-gray-900 text-sm md:text-base leading-snug">{namaStr}</h4>
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  {jabatanStr}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyle.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                  {tugasStr}
                                </span>
                              </div>
                            </div>
                            {/* Detailed information */}
                            <div className="bg-white border border-amber-100 p-3 rounded-xl space-y-2 text-[11px] text-slate-600 shadow-sm mt-3">
                              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                                <span className="text-slate-400 font-medium">NIP Pegawai:</span>
                                <span className="font-bold text-slate-900">{nipStr}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                                <span className="text-slate-400 font-medium">No Telepon/WA:</span>
                                <span className="font-bold text-indigo-600 hover:underline">
                                  <a href={`https://wa.me/${teleponStr.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    {teleponStr} 💬
                                  </a>
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Username / Email:</span>
                                <span className="font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded">{usernameStr}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2.5 mt-5 pt-4 border-t border-amber-100/60">
                            <button
                              onClick={() => onApproveAccount(usernameStr)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all text-[11px] shadow-sm shadow-emerald-600/20"
                            >
                              <Check className="w-4 h-4" /> Setujui Akun
                            </button>
                            <button
                              onClick={() => onRejectAccount(usernameStr)}
                              className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all text-[11px]"
                            >
                              <X className="w-4 h-4" /> Tolak
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 font-medium">
                    Tidak ada permohonan pendaftaran akun baru yang menunggu konfirmasi saat ini.
                  </div>
                )}
              </div>

              {/* Master directory of approved accounts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-indigo-500" />
                    Direktori Akun Terkonfirmasi / Aktif
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-1">
                      {activeOrRejectedAccounts.length} Total
                    </span>
                  </h3>
                </div>
                
                {/* DESKTOP / TABLET TABLE VIEW (Visible on >= 640px) */}
                <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="p-4 rounded-tl-2xl">Pegawai / NIP</th>
                        <th className="p-4">Jabatan & Tugas</th>
                        <th className="p-4">Username & Telepon</th>
                        <th className="p-4">Kata Sandi</th>
                        <th className="p-4 text-center">Status / Role</th>
                        <th className="p-4 text-center rounded-tr-2xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {activeOrRejectedAccounts.map((acc, idx) => {
                        const usernameStr = String(acc?.username || `user-${idx}`);
                        const isEditing = editingUser === usernameStr;
                        
                        return (
                          <tr key={usernameStr} className="hover:bg-slate-50/50 even:bg-slate-50/30 transition-colors">
                            {/* PEGAWAI / NIP */}
                            <td className="p-4 align-top">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500" 
                                    value={editFormData.nama} 
                                    onChange={e => setEditFormData({...editFormData, nama: e.target.value})}
                                    placeholder="Nama Lengkap"
                                  />
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono text-[10px]" 
                                    value={editFormData.nip} 
                                    onChange={e => setEditFormData({...editFormData, nip: e.target.value})}
                                    placeholder="NIP Pegawai"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-900 block text-[13px]">{acc.nama}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">NIP: {acc.nip || '-'}</span>
                                </div>
                              )}
                            </td>

                            {/* JABATAN & TUGAS */}
                            <td className="p-4 align-top">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500" 
                                    value={editFormData.jabatan} 
                                    onChange={e => setEditFormData({...editFormData, jabatan: e.target.value})}
                                    placeholder="Jabatan"
                                  />
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500" 
                                    value={editFormData.tugas} 
                                    onChange={e => setEditFormData({...editFormData, tugas: e.target.value})}
                                    placeholder="Tugas (mis. Kepala Gudang)"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className="font-bold text-slate-800 block">{acc.jabatan || '-'}</span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getTugasBadgeClass(acc.tugas || getDefaultTugasByJabatan(acc.jabatan || '')).badge}`}>
                                    {acc.tugas || getDefaultTugasByJabatan(acc.jabatan || '')}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* USERNAME & TELEPON */}
                            <td className="p-4 align-top">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-slate-200 bg-slate-100 rounded text-slate-500 font-mono text-[10px] cursor-not-allowed" 
                                    value={usernameStr} 
                                    disabled
                                    title="Username tidak bisa diedit setelah dibuat"
                                  />
                                  <input 
                                    type="text" 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500" 
                                    value={editFormData.telepon} 
                                    onChange={e => setEditFormData({...editFormData, telepon: e.target.value})}
                                    placeholder="Nomor WA / Telepon"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="font-mono text-slate-800 font-semibold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded block max-w-max text-[11px]">{usernameStr}</span>
                                  <span className="text-[10px] text-slate-500 block">📞 {acc.telepon || '-'}</span>
                                </div>
                              )}
                            </td>

                            {/* KATA SANDI */}
                            <td className="p-4 align-top">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono" 
                                  value={editFormData.password || ''} 
                                  onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                                  placeholder="Kata Sandi"
                                />
                              ) : (
                                <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold select-all text-[11px] border border-slate-200">
                                  {acc.password || '-'}
                                </span>
                              )}
                            </td>

                            {/* STATUS & ROLE */}
                            <td className="p-4 align-top text-center">
                              {isEditing ? (
                                <div className="space-y-2 text-left">
                                  <select 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    value={editFormData.status}
                                    onChange={e => setEditFormData({...editFormData, status: e.target.value as any})}
                                  >
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Ditolak">Ditolak</option>
                                  </select>
                                  <select 
                                    className="w-full p-1.5 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    value={editFormData.role}
                                    onChange={e => setEditFormData({...editFormData, role: e.target.value as any})}
                                  >
                                    <option value="Petugas BMN">Petugas BMN</option>
                                    <option value="Administrator">Administrator</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-1.5 flex flex-col items-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    acc.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    acc.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {acc.status}
                                  </span>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                    acc.role === 'Administrator' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {acc.role}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* AKSI */}
                            <td className="p-4 align-top">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(usernameStr)}
                                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg cursor-pointer transition-colors shadow-sm"
                                      title="Simpan Perubahan"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors shadow-sm"
                                      title="Batal"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(acc)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg cursor-pointer transition-colors shadow-sm"
                                      title="Edit Akun"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAccountClick(usernameStr)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer transition-colors shadow-sm"
                                      title="Hapus Akun"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {activeOrRejectedAccounts.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      Belum ada akun yang terdaftar atau aktif.
                    </div>
                  )}
                </div>

                {/* MOBILE CARD VIEW (Visible on < 640px) */}
                <div className="block sm:hidden space-y-3">
                  {activeOrRejectedAccounts.length === 0 ? (
                    <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                      Belum ada akun yang terdaftar atau aktif.
                    </div>
                  ) : (
                    activeOrRejectedAccounts.map((acc, idx) => {
                      const usernameStr = String(acc?.username || `user-${idx}`);
                      const isEditing = editingUser === usernameStr;
                      const tugasVal = acc.tugas || getDefaultTugasByJabatan(acc.jabatan || '');
                      const badgeStyle = getTugasBadgeClass(tugasVal);

                      return (
                        <div
                          key={`mobile_acc_${usernameStr}`}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                        >
                          {isEditing ? (
                            /* Mobile Edit Mode Form */
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-indigo-700">Edit Akun: {usernameStr}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Mode Edit</span>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                                  value={editFormData.nama}
                                  onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                                  placeholder="Nama Lengkap"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">NIP Pegawai</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.nip}
                                    onChange={e => setEditFormData({ ...editFormData, nip: e.target.value })}
                                    placeholder="NIP"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Telepon / WA</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.telepon}
                                    onChange={e => setEditFormData({ ...editFormData, telepon: e.target.value })}
                                    placeholder="08..."
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.jabatan}
                                    onChange={e => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                                    placeholder="Jabatan"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tugas</label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.tugas}
                                    onChange={e => setEditFormData({ ...editFormData, tugas: e.target.value })}
                                    placeholder="Tugas"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Kata Sandi</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-indigo-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                                  value={editFormData.password || ''}
                                  onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                                  placeholder="Kata Sandi"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                                  <select
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.status}
                                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                                  >
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Ditolak">Ditolak</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                                  <select
                                    className="w-full p-2 border border-indigo-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                                    value={editFormData.role}
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}
                                  >
                                    <option value="Petugas BMN">Petugas BMN</option>
                                    <option value="Administrator">Administrator</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(usernameStr)}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" /> Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Mobile Display Mode Card */
                            <div className="space-y-3 text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-extrabold text-slate-900 text-sm">{acc.nama}</h4>
                                  <span className="text-[10px] text-slate-400 font-mono block">NIP: {acc.nip || '-'}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    acc.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    acc.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {acc.status}
                                  </span>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                    acc.role === 'Administrator' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {acc.role}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-[11px] text-slate-600">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                  <span className="text-slate-400">Jabatan:</span>
                                  <span className="font-bold text-slate-800">{acc.jabatan || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                  <span className="text-slate-400">Tugas / Peran:</span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle.badge}`}>
                                    {tugasVal}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                  <span className="text-slate-400">Username:</span>
                                  <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{usernameStr}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                  <span className="text-slate-400">Kata Sandi:</span>
                                  <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100 select-all">{acc.password || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">No. Telepon / WA:</span>
                                  <a
                                    href={`https://wa.me/${String(acc.telepon || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-indigo-600 hover:underline"
                                  >
                                    📞 {acc.telepon || '-'}
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  onClick={() => handleStartEdit(acc)}
                                  className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Edit Akun
                                </button>
                                <button
                                  onClick={() => handleDeleteAccountClick(usernameStr)}
                                  className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'statistik' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3">
                Agregat Informasi Ketersediaan BMN
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-1.5 shadow-sm hover:border-slate-300 transition-colors">
                  <span className="text-slate-600 font-extrabold block uppercase text-[10px] tracking-wider">Total Item Master</span>
                  <span className="text-3xl font-black text-slate-900 block">{totalItems}</span>
                  <span className="text-[10px] text-slate-500 block">Katalog BMN Terdaftar</span>
                </div>
                
                <div className="bg-amber-50 p-5 border border-amber-200 rounded-2xl space-y-1.5 shadow-sm hover:border-amber-300 transition-colors">
                  <span className="text-amber-800 font-extrabold block uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Stok Menipis
                  </span>
                  <span className="text-3xl font-black text-amber-900 block">{lowStockItems}</span>
                  <span className="text-[10px] text-amber-700 block font-medium">Segera order restock</span>
                </div>

                <div className="bg-rose-50 p-5 border border-rose-200 rounded-2xl space-y-1.5 shadow-sm hover:border-rose-300 transition-colors">
                  <span className="text-rose-800 font-extrabold block uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Stok Habis (0)
                  </span>
                  <span className="text-3xl font-black text-rose-900 block">{outOfStockItems}</span>
                  <span className="text-[10px] text-rose-700 block font-medium">Ketersediaan Kritis</span>
                </div>

                <div className="bg-indigo-50 p-5 border border-indigo-200 rounded-2xl space-y-1.5 shadow-sm hover:border-indigo-300 transition-colors">
                  <span className="text-indigo-800 font-extrabold block uppercase text-[10px] tracking-wider">Mutasi Terlacak</span>
                  <span className="text-3xl font-black text-indigo-900 block">{safeRiwayatList.length}</span>
                  <span className="text-[10px] text-indigo-700 block font-medium">In: {totalInbound} | Out: {totalOutbound}</span>
                </div>
              </div>

              {/* Recent BMN Transactions logs */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h4 className="font-extrabold text-gray-900 text-sm">Visualisasi Singkat & 5 Riwayat Terakhir</h4>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
                  {safeRiwayatList.slice(0, 5).map((r, idx) => (
                    <div key={`${r.id}-${idx}`} className="flex justify-between items-center bg-slate-50 p-3.5 border border-slate-100 rounded-xl text-xs font-semibold hover:border-slate-300 transition-colors">
                      <div className="space-y-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                          r.tipe === 'Masuk' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {r.tipe.toUpperCase()}
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-[13px] leading-tight">{r.namaBarang}</h5>
                        <p className="text-[10px] text-slate-500 font-medium">Petugas: {r.petugas || '-'} • {formatDateSafe(r.tanggal)}</p>
                      </div>
                      <span className={`font-black text-lg ${r.tipe === 'Masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.tipe === 'Masuk' ? '+' : '-'}{r.jumlah}
                      </span>
                    </div>
                  ))}
                  {safeRiwayatList.length === 0 && (
                    <div className="text-center p-6 text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                      Belum ada riwayat transaksi mutasi BMN yang tercatat.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'integrasi' && (
            <div className="space-y-8">
              <div className="space-y-3 border-b border-gray-100 pb-4">
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Manajemen Migrasi & Pencadangan Data BMN
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  Fitur ini memungkinkan Administrator untuk mengunduh seluruh transaksi yang pernah terjadi sebagai file arsip, sekaligus <strong>mereset</strong> riwayat di aplikasi untuk menjaga performa sistem. Sangat disarankan dilakukan di penghujung tahun atau akhir periode anggaran.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-blue-100">
                  <Database className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="font-extrabold text-slate-900 block text-sm">Migrasi Database Utama</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Proses ini akan mengekspor seluruh rekaman transaksi mutasi (Masuk & Keluar), riwayat pergerakan logistik, audit log sistem, dan notifikasi ke dalam format spreadsheet CSV/Excel yang dapat diunduh langsung. 
                    <br/><br/>
                    Setelah berhasil diunduh, sistem akan <strong>MENGOSONGKAN</strong> data-data operasional (transaksional) tersebut. <span className="font-bold text-rose-600">Catatan: Data Master (Barang, Kategori, Satuan, Supplier, Pegawai) TIDAK AKAN terhapus.</span>
                  </p>
                  
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMigrateConfirmModal(true)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all text-xs"
                    >
                      <Download className="w-4 h-4" /> 
                      Eksekusi Migrasi & Kosongkan Log
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> ID Spreadsheet Utama
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-500 font-medium block">ID File Sync (Read-Only):</span>
                    <input 
                       type="text" 
                       disabled
                      value={safeSettings.spreadsheetId || 'Belum diatur'} 
                       className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-600 font-mono text-[11px] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <CloudLightning className="w-5 h-5 text-sky-600" /> ID Penyimpanan Cloud
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-500 font-medium block">Folder QR Code (Google Drive):</span>
                    <span className="font-mono bg-white border border-slate-200 px-3 py-2 rounded-xl block text-[11px] text-slate-600 truncate shadow-sm">
                      {safeSettings.folderQrId || 'Belum diatur'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-500 font-medium block">Folder Laporan (Google Drive):</span>
                    <span className="font-mono bg-white border border-slate-200 px-3 py-2 rounded-xl block text-[11px] text-slate-600 truncate shadow-sm">
                      {safeSettings.folderReportsId || 'Belum diatur'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS AKUN */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-xs text-rose-900 space-y-1">
              <p className="font-semibold leading-relaxed">
                Apakah Anda yakin ingin menghapus akun pegawai <span className="font-bold font-mono underline">{userToDelete}</span> secara permanen dari basis data?
              </p>
              <p className="text-[11px] text-rose-700">
                Pegawai yang bersangkutan tidak akan bisa lagi masuk ke sistem logistik BMN.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-rose-600/20 transition-all"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROTEKSI AKUN ADMIN */}
      {showAdminProtectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Proteksi Akun Administrator</h3>
                <p className="text-xs text-slate-500">Sistem Otorisasi BMN</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 p-3.5 rounded-xl font-medium">
              Akun <span className="font-bold font-mono text-slate-900">admin</span> adalah akun Administrator Utama sistem dan tidak dapat dihapus demi keamanan operasional lembaga.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAdminProtectModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI MIGRASI DATABASE */}
      {showMigrateConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Migrasi Database</h3>
                <p className="text-xs text-slate-500">Backup & Pembersihan Log</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl">
              Proses ini akan mengunduh backup CSV dan mengosongkan log transaksi transaksional. <strong className="text-slate-900">Data Master Barang tetap utuh.</strong>
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowMigrateConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmMigrate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
              >
                Lanjutkan Migrasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
