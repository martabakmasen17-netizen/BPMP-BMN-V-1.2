/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Shield, RefreshCcw, Trash2, FileSpreadsheet, ShieldAlert, X } from 'lucide-react';
import { AuditLog, UserAccount } from '../types';
import ExportConfirmModal, { ExportFormat } from './ExportConfirmModal';

interface AuditLogViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
  onDeleteLogs?: (ids: string[]) => void;
  currentUser: UserAccount;
}

export default function AuditLogView({ logs, onClearLogs, onDeleteLogs, currentUser }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const isAdmin = currentUser.role === 'Administrator' || currentUser.username === 'admin';

  // Extract available months
  const availableMonths = Array.from(
    new Set(
      logs
        .map(l => (l.tanggal ? l.tanggal.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch =
        log.aktor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.aksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMonth =
        selectedMonth === 'all' ? true : log.tanggal && log.tanggal.startsWith(selectedMonth);

      return matchesSearch && matchesMonth;
    })
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLogs.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSelected = () => {
    if (onDeleteLogs && selectedIds.length > 0) {
      onDeleteLogs(selectedIds);
      setSelectedIds([]);
      setShowDeleteConfirmModal(false);
    }
  };

  const executeExportCSV = (data: AuditLog[], summaryText: string) => {
    const headers = 'ID Log,Tanggal,Aktor,Role,Aksi,Detail\n';
    const rows = data
      .map(
        l =>
          `"${l.id}","${new Date(l.tanggal).toLocaleString('id-ID')}","${l.aktor}","${l.role}","${l.aksi}","${l.detail.replace(/"/g, '""')}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Audit_Log_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Delete Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                KONFIRMASI HAPUS AUDIT LOG
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="p-1 hover:bg-red-700 rounded-lg text-red-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-slate-700">
              <p className="font-semibold text-slate-900">
                Apakah Anda yakin ingin menghapus <strong className="text-red-600 font-bold">{selectedIds.length} catatan audit log</strong> yang dipilih?
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>PERHATIAN (ADMIN ONLY):</strong> Tindakan ini akan mengosongkan log aktivitas dari database dan Google Sheets. Pastikan telah mengunduh file rekap CSV sebelum melakukan pembersihan.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus {selectedIds.length} Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-auto flex-1 flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pelaku, peran, aksi, rincian..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">🗓️ Semua Periode Bulan</option>
            {availableMonths.map(m => {
              const [yr, mo] = m.split('-');
              const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
              const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  📅 {monthLabel}
                </option>
              );
            })}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => setShowExportModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" /> Unduh Rekap CSV
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Kosongkan Semua Log
            </button>
          )}
        </div>
      </div>

      {/* Terminal logs list */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
            <h3 className="font-bold text-gray-900 text-sm">Buku Catatan Keamanan & Log Aktivitas (Audit Trail)</h3>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full uppercase">
            Sistem Aktif
          </span>
        </div>

        {/* DESKTOP / TABLET TABLE VIEW (Visible on >= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                {isAdmin && (
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredLogs.length && filteredLogs.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                  </th>
                )}
                <th className="p-4">Stempel Waktu (WIB)</th>
                <th className="p-4">Aktor / Pelaku</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4">Aksi / Operasi</th>
                <th className="p-4">Rincian Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center text-gray-400">
                    Tidak ada catatan aktivitas terekam.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={`${log.id}_${idx}`} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.includes(log.id) ? 'bg-blue-50/50' : ''}`}>
                    {isAdmin && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log.id)}
                          onChange={() => handleToggleSelectRow(log.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                      </td>
                    )}
                    <td className="p-4 font-mono text-[11px] text-gray-500">
                      {new Date(log.tanggal).toLocaleDateString('id-ID')} {new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{log.aktor}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.role.includes('Admin') ? 'bg-blue-100 text-blue-700' :
                        log.role.includes('Subbagian') ? 'bg-amber-100 text-amber-700' :
                        log.role.includes('Petugas') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{log.aksi}</td>
                    <td className="p-4 text-gray-500 max-w-sm font-medium">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Visible on < 640px) */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-xs font-medium">
              Tidak ada catatan aktivitas terekam.
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={`mobile_log_${log.id}_${idx}`}
                className={`p-4 space-y-2.5 transition-colors ${
                  selectedIds.includes(log.id) ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Header: Checkbox + Timestamp + Role */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log.id)}
                        onChange={() => handleToggleSelectRow(log.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    )}
                    <span className="font-mono text-[11px] text-gray-500 font-medium">
                      {new Date(log.tanggal).toLocaleDateString('id-ID')} • {new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.role.includes('Admin') ? 'bg-blue-100 text-blue-700' :
                    log.role.includes('Subbagian') ? 'bg-amber-100 text-amber-700' :
                    log.role.includes('Petugas') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {log.role}
                  </span>
                </div>

                {/* Actor & Action */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-gray-900 text-xs">{log.aktor}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px] uppercase tracking-wider">
                    {log.aksi}
                  </span>
                </div>

                {/* Detail Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-gray-600 leading-relaxed break-words">
                  {log.detail}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Kosongkan Semua Log Audit</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50 border border-rose-100 p-3.5 rounded-xl font-medium">
              Apakah Anda yakin ingin menghapus SELURUH riwayat log audit aktivitas secara permanen?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs();
                  setShowClearAllModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-rose-600/20 transition-all"
              >
                Ya, Kosongkan Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirm Modal */}
      <ExportConfirmModal<AuditLog>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Konfirmasi Ekspor Log Audit Keamanan"
        description="Pilih rentang bulan atau tanggal log aktivitas yang akan diunduh"
        dataList={filteredLogs}
        getDateFn={item => item.tanggal || ''}
        onConfirm={(filteredData, format, summaryText) => {
          executeExportCSV(filteredData, summaryText);
        }}
      />
    </div>
  );
}
