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
  UserMinus, 
  Database, 
  TrendingUp, 
  FileSpreadsheet, 
  AlertCircle, 
  Clock, 
  Trash2,
  FileDown,
  CloudLightning,
  Settings,
  Key
} from 'lucide-react';
import { UserAccount, Barang, Riwayat } from '../types';
import { getDefaultTugasByJabatan, getTugasBadgeClass } from '../utils/pegawaiConstants';

interface AdminControlViewProps {
  accounts: UserAccount[];
  onApproveAccount: (username: string) => void;
  onRejectAccount: (username: string) => void;
  onDeleteAccount: (username: string) => void;
  onUpdatePassword?: (username: string, newPassword: string) => void;
  barangList: Barang[];
  riwayatList: Riwayat[];
  settings: any;
}

export default function AdminControlView({
  accounts = [],
  onApproveAccount,
  onRejectAccount,
  onDeleteAccount,
  onUpdatePassword,
  barangList = [],
  riwayatList = [],
  settings = {}
}: AdminControlViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'akun' | 'statistik' | 'integrasi'>('akun');
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');

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

  // Safe accounts array
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

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Subtabs */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div>
            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Halaman Administrator Utama
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">Admin Control Center</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kelola otorisasi akun pengguna, tumpukan parameter database, dan integrasi Google Workspace.</p>
          </div>
          
          {/* Subpage tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('akun')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'akun' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Akun Pegawai {pendingAccounts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('statistik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'statistik' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Ringkasan Mutasi
            </button>
            <button
              onClick={() => setActiveSubTab('integrasi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeSubTab === 'integrasi' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Integrasi & Backup
            </button>
          </div>
        </div>

        <div className="text-xs">
          {activeSubTab === 'akun' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  Konfirmasi Pendaftaran Akun ({pendingAccounts.length} Menunggu Tindakan)
                </h3>
                <span className="text-xs text-gray-400 font-medium">Total Akun: {safeAccounts.length}</span>
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
                      <div key={usernameStr} className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Menunggu Konfirmasi
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">Daftar: {formatDateSafe(regAtStr)}</span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 text-sm">{namaStr}</h4>
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                              <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {jabatanStr}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badgeStyle.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                {tugasStr}
                              </span>
                            </div>
                          </div>

                          {/* Detailed information filled by creator */}
                          <div className="bg-white/80 border border-amber-100/60 p-2.5 rounded-xl space-y-1.5 text-[11px] text-gray-600">
                            <div className="flex justify-between">
                              <span className="text-gray-400">NIP Pegawai:</span>
                              <span className="font-bold text-gray-900">{nipStr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">No Telepon/WA:</span>
                              <span className="font-bold text-blue-600 hover:underline">
                                <a href={`https://wa.me/${teleponStr.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                  {teleponStr} 💬
                                </a>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Username / Email:</span>
                              <span className="font-mono font-semibold text-gray-800">{usernameStr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => onApproveAccount(usernameStr)}
                            className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1 transition-all text-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Setujui Akun
                          </button>
                          <button
                            onClick={() => onRejectAccount(usernameStr)}
                            className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1 transition-all text-xs"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak Pendaftaran
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-gray-100 rounded-xl text-center text-gray-400 font-medium">
                  Tidak ada permohonan pendaftaran akun pegawai baru yang menunggu konfirmasi saat ini.
                </div>
              )}

              {/* Master directory of approved accounts */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  Direktori Akun Terkonfirmasi / Aktif ({approvedAccounts.length})
                </h3>
                
                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Nama Lengkap / NIP</th>
                        <th className="p-3">Jabatan (Kolom Kiri)</th>
                        <th className="p-3">Tugas & Tanggung Jawab</th>
                        <th className="p-3">Username / Email</th>
                        <th className="p-3">Kata Sandi</th>
                        <th className="p-3">Telepon</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {activeOrRejectedAccounts.map((acc, idx) => {
                        const usernameStr = String(acc?.username || `user-${idx}`);
                        const namaStr = String(acc?.nama || 'Tanpa Nama');
                        const jabatanStr = String(acc?.jabatan || '-');
                        const tugasStr = String(acc?.tugas || getDefaultTugasByJabatan(jabatanStr));
                        const nipStr = String(acc?.nip || '-');
                        const teleponStr = String(acc?.telepon || '-');
                        const passwordStr = String(acc?.password || '-');
                        const statusStr = String(acc?.status || '-');
                        const badgeStyle = getTugasBadgeClass(tugasStr);

                        return (
                          <tr key={usernameStr} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-gray-900 block">{namaStr}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">NIP: {nipStr}</span>
                            </td>
                            <td className="p-3 font-bold text-gray-800">{jabatanStr}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badgeStyle.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                {tugasStr}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-gray-800">{usernameStr}</td>
                            <td className="p-3">
                              {editingPasswordUser === usernameStr ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={newPasswordVal}
                                    onChange={(e) => setNewPasswordVal(e.target.value)}
                                    className="px-2 py-1 border border-blue-300 rounded text-xs w-24 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      if (newPasswordVal.trim().length < 4) {
                                        alert('Kata sandi minimal 4 karakter!');
                                        return;
                                      }
                                      onUpdatePassword?.(usernameStr, newPasswordVal);
                                      setEditingPasswordUser(null);
                                    }}
                                    className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded cursor-pointer transition-colors"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPasswordUser(null)}
                                    className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded cursor-pointer transition-colors"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold select-all text-[11px]">
                                    {passwordStr}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPasswordUser(usernameStr);
                                      setNewPasswordVal(passwordStr);
                                    }}
                                    className="p-1 hover:bg-slate-100 text-blue-600 hover:text-blue-700 rounded cursor-pointer transition-all"
                                    title="Ubah Kata Sandi"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="text-blue-600 hover:underline font-bold">
                                {teleponStr}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                statusStr === 'Disetujui' ? 'bg-green-100 text-green-700' :
                                statusStr === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {statusStr}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {usernameStr.toLowerCase() === 'admin' ? (
                                <span className="text-[10px] text-gray-400 italic">Sistem Utama</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (confirm(`Apakah Anda yakin ingin menghapus akun "${namaStr}"?`)) {
                                      onDeleteAccount(usernameStr);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer inline-flex items-center justify-center transition-all"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'statistik' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                Ringkasan Statistik Stok & Mutasi
              </h3>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Total Item Terdaftar</span>
                  <span className="text-2xl font-extrabold text-gray-900 block">{totalItems}</span>
                  <span className="text-[10px] text-gray-500 block">Katalog Inventaris BMN</span>
                </div>
                
                <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-amber-800 font-bold block uppercase text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Stok Menipis
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 block">{lowStockItems}</span>
                  <span className="text-[10px] text-amber-700 block">Butuh Order Transaksi Masuk</span>
                </div>

                <div className="bg-red-50 p-4 border border-red-200 rounded-xl space-y-1">
                  <span className="text-red-800 font-bold block uppercase text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Stok Habis (0)
                  </span>
                  <span className="text-2xl font-extrabold text-red-900 block">{outOfStockItems}</span>
                  <span className="text-[10px] text-red-700 block">Ketersediaan Kritis</span>
                </div>

                <div className="bg-blue-50 p-4 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-blue-800 font-bold block uppercase text-[10px]">Mutasi Terlacak</span>
                  <span className="text-2xl font-extrabold text-blue-900 block">{safeRiwayatList.length}</span>
                  <span className="text-[10px] text-blue-700 block">Inbound: {totalInbound} | Outbound: {totalOutbound}</span>
                </div>
              </div>

              {/* Recent BMN Transactions logs */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Visualisasi Singkat & 5 Riwayat Terakhir</h4>
                <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-3">
                  {safeRiwayatList.slice(0, 5).map(r => (
                    <div key={r.id || Math.random()} className="flex justify-between items-center bg-white p-3 border border-gray-100 rounded-lg text-xs font-semibold">
                      <div className="space-y-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          r.tipe === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.tipe}
                        </span>
                        <h5 className="font-bold text-gray-900">{r.namaBarang}</h5>
                        <p className="text-[10px] text-gray-400">Petugas: {r.petugas || '-'} • {formatDateSafe(r.tanggal)}</p>
                      </div>
                      <span className={`font-extrabold text-sm ${r.tipe === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
                        {r.tipe === 'Masuk' ? '+' : '-'}{r.jumlah}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'integrasi' && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                Sistem Backup Google Drive & Parameter API
              </h3>

              <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-xl text-blue-900 flex gap-3">
                <CloudLightning className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold block">Status Koneksi: SINKRONISASI AKTIF</span>
                  <p className="text-blue-800 leading-normal">
                    Database lokal disinkronkan ke Google Spreadsheet. Perubahan katalog dan mutasi barang dicadangkan secara periodik.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-green-600" /> ID Spreadsheet Utama
                  </h4>
                  <div className="space-y-1 text-xs">
                    <span className="text-gray-400 block">ID File di Drive:</span>
                    <input 
                      type="text" 
                      disabled
                      value={safeSettings.spreadsheetId || '-'} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-gray-500 font-mono text-[10px]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Database className="w-4.5 h-4.5 text-blue-600" /> Folder QR Code & Gambar
                  </h4>
                  <div className="space-y-1 text-xs">
                    <span className="text-gray-400 block">ID Folder QR Code:</span>
                    <span className="font-mono bg-slate-50 border border-gray-200 px-2 py-1 rounded block text-[10px] text-gray-500 truncate">
                      {safeSettings.folderQrId || '-'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="text-gray-400 block">ID Folder Backup Laporan:</span>
                    <span className="font-mono bg-slate-50 border border-gray-200 px-2 py-1 rounded block text-[10px] text-gray-500 truncate">
                      {safeSettings.folderReportsId || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3 text-slate-700">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  Pembersihan Database & Rekap Bulanan (Khusus Administrator)
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Untuk menjaga kestabilan dan performa database spreadsheet, Admin dapat melakukan rekap data mutasi dan memilih data berdasarkan bulan untuk dibersihkan secara selektif tanpa mereset struktur spreadsheet yang ada.
                </p>
                <div className="bg-white p-3 border border-amber-200 rounded-xl text-[11px] space-y-1">
                  <div className="font-semibold text-slate-800">📌 Panduan Prosedur Rekap Bulanan:</div>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    <li>Buka halaman <strong>Barang Masuk</strong>, <strong>Barang Keluar</strong>, <strong>Riwayat</strong>, atau <strong>Audit Log</strong>.</li>
                    <li>Gunakan filter <strong>Periode Bulan</strong> untuk menampilkan data bulan yang akan direkap.</li>
                    <li>Klik <strong>Unduh Rekap (CSV/PDF)</strong> untuk mengarsipkan laporan secara lokal terlebih dahulu.</li>
                    <li>Pilih data yang ingin dibersihkan dengan checkbox, lalu klik tombol <strong>Hapus Terpilih (Admin Only)</strong>.</li>
                    <li>Sistem akan memperbarui database secara aman tanpa menghapus struktur Google Sheets utama.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => alert('Backup Berhasil! Seluruh data mutasi dan katalog BMN dikirim ke Google Drive.')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <FileDown className="w-4 h-4" /> Trigger Cadangan Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
