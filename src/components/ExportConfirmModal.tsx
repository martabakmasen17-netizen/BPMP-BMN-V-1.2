/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Download,
  X,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Filter,
  Check,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export type ExportFormat = 'pdf' | 'excel';
export type FilterCategory = 'all' | 'monthly' | 'daily';
export type MonthlySubMode = 'single' | 'range' | 'multiple';
export type DailySubMode = 'single' | 'range' | 'multiple';

interface ExportConfirmModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  dataList: T[];
  getDateFn: (item: T) => string; // Returns YYYY-MM-DD or ISO string
  onConfirm: (
    filteredData: T[],
    format: ExportFormat,
    summaryText: string
  ) => void;
  allowedFormats?: ExportFormat[]; // default ['pdf', 'excel']
}

export default function ExportConfirmModal<T>({
  isOpen,
  onClose,
  title = 'Konfirmasi Cetak & Unduh Laporan',
  description = 'Pilih periode waktu data yang ingin dicetak/diunduh sebelum melanjutkan.',
  dataList,
  getDateFn,
  onConfirm,
  allowedFormats = ['pdf', 'excel']
}: ExportConfirmModalProps<T>) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    allowedFormats[0] || 'pdf'
  );

  // Filter Categories: 'all' | 'monthly' | 'daily'
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  // Monthly Sub-mode
  const [monthlySubMode, setMonthlySubMode] = useState<MonthlySubMode>('single');
  const [singleMonth, setSingleMonth] = useState<string>('');
  const [rangeMonthStart, setRangeMonthStart] = useState<string>('');
  const [rangeMonthEnd, setRangeMonthEnd] = useState<string>('');
  const [selectedMonthsList, setSelectedMonthsList] = useState<string[]>([]);

  // Daily Sub-mode
  const [dailySubMode, setDailySubMode] = useState<DailySubMode>('single');
  const [singleDate, setSingleDate] = useState<string>('');
  const [rangeDateStart, setRangeDateStart] = useState<string>('');
  const [rangeDateEnd, setRangeDateEnd] = useState<string>('');
  const [selectedDatesList, setSelectedDatesList] = useState<string[]>([]);

  // Extract all unique YYYY-MM and YYYY-MM-DD from dataList
  const { availableMonths, availableDates } = useMemo(() => {
    const monthsSet = new Set<string>();
    const datesSet = new Set<string>();

    dataList.forEach(item => {
      const rawDate = getDateFn(item);
      if (rawDate) {
        const dStr = rawDate.slice(0, 10); // YYYY-MM-DD
        const mStr = rawDate.slice(0, 7);  // YYYY-MM
        if (dStr && dStr.length === 10) datesSet.add(dStr);
        if (mStr && mStr.length === 7) monthsSet.add(mStr);
      }
    });

    return {
      availableMonths: Array.from(monthsSet).sort((a, b) => b.localeCompare(a)),
      availableDates: Array.from(datesSet).sort((a, b) => b.localeCompare(a))
    };
  }, [dataList, getDateFn]);

  // Set default fallback values if available
  React.useEffect(() => {
    if (availableMonths.length > 0) {
      if (!singleMonth) setSingleMonth(availableMonths[0]);
      if (!rangeMonthStart) setRangeMonthStart(availableMonths[availableMonths.length - 1]);
      if (!rangeMonthEnd) setRangeMonthEnd(availableMonths[0]);
    }
    if (availableDates.length > 0) {
      if (!singleDate) setSingleDate(availableDates[0]);
      if (!rangeDateStart) setRangeDateStart(availableDates[availableDates.length - 1]);
      if (!rangeDateEnd) setRangeDateEnd(availableDates[0]);
    }
  }, [availableMonths, availableDates]);

  // Compute Filtered Data & Summary Label
  const { filteredData, summaryText } = useMemo(() => {
    if (filterCategory === 'all') {
      return {
        filteredData: dataList,
        summaryText: 'Semua Periode (Keseluruhan Data)'
      };
    }

    if (filterCategory === 'monthly') {
      if (monthlySubMode === 'single') {
        if (!singleMonth) return { filteredData: dataList, summaryText: 'Bulan Belum Dipilih' };
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          return d && d.startsWith(singleMonth);
        });
        const monthLabel = new Date(singleMonth + '-01').toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric'
        });
        return {
          filteredData: result,
          summaryText: `Bulan ${monthLabel}`
        };
      }

      if (monthlySubMode === 'range') {
        if (!rangeMonthStart || !rangeMonthEnd) {
          return { filteredData: dataList, summaryText: 'Rentang Bulan Belum Lengkap' };
        }
        const start = rangeMonthStart < rangeMonthEnd ? rangeMonthStart : rangeMonthEnd;
        const end = rangeMonthStart < rangeMonthEnd ? rangeMonthEnd : rangeMonthStart;
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          if (!d) return false;
          const m = d.slice(0, 7);
          return m >= start && m <= end;
        });
        return {
          filteredData: result,
          summaryText: `Rentang Bulan ${start} s.d ${end}`
        };
      }

      if (monthlySubMode === 'multiple') {
        if (selectedMonthsList.length === 0) {
          return { filteredData: [], summaryText: 'Tidak Ada Bulan Dipilih' };
        }
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          if (!d) return false;
          const m = d.slice(0, 7);
          return selectedMonthsList.includes(m);
        });
        return {
          filteredData: result,
          summaryText: `Beberapa Bulan (${selectedMonthsList.length} bulan terpilih)`
        };
      }
    }

    if (filterCategory === 'daily') {
      if (dailySubMode === 'single') {
        if (!singleDate) return { filteredData: dataList, summaryText: 'Tanggal Belum Dipilih' };
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          return d && d.startsWith(singleDate);
        });
        const dateLabel = new Date(singleDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        return {
          filteredData: result,
          summaryText: `Tanggal ${dateLabel}`
        };
      }

      if (dailySubMode === 'range') {
        if (!rangeDateStart || !rangeDateEnd) {
          return { filteredData: dataList, summaryText: 'Rentang Tanggal Belum Lengkap' };
        }
        const start = rangeDateStart < rangeDateEnd ? rangeDateStart : rangeDateEnd;
        const end = rangeDateStart < rangeDateEnd ? rangeDateEnd : rangeDateStart;
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          if (!d) return false;
          const dateStr = d.slice(0, 10);
          return dateStr >= start && dateStr <= end;
        });
        return {
          filteredData: result,
          summaryText: `Rentang Tanggal ${start} s.d ${end}`
        };
      }

      if (dailySubMode === 'multiple') {
        if (selectedDatesList.length === 0) {
          return { filteredData: [], summaryText: 'Tidak Ada Tanggal Dipilih' };
        }
        const result = dataList.filter(item => {
          const d = getDateFn(item);
          if (!d) return false;
          const dateStr = d.slice(0, 10);
          return selectedDatesList.includes(dateStr);
        });
        return {
          filteredData: result,
          summaryText: `Beberapa Tanggal (${selectedDatesList.length} hari terpilih)`
        };
      }
    }

    return { filteredData: dataList, summaryText: 'Keseluruhan Data' };
  }, [
    dataList,
    getDateFn,
    filterCategory,
    monthlySubMode,
    singleMonth,
    rangeMonthStart,
    rangeMonthEnd,
    selectedMonthsList,
    dailySubMode,
    singleDate,
    rangeDateStart,
    rangeDateEnd,
    selectedDatesList
  ]);

  if (!isOpen) return null;

  const handleToggleMonthCheck = (m: string) => {
    setSelectedMonthsList(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleToggleDateCheck = (d: string) => {
    setSelectedDatesList(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleExecuteExport = () => {
    onConfirm(filteredData, selectedFormat, summaryText);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-3 inset-y-6 sm:inset-x-auto sm:inset-y-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[110] overflow-hidden flex flex-col border border-slate-200/80 max-h-[90vh]"
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between gap-4 flex-shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {title}
                  </h3>
                  <p className="text-xs text-blue-100 font-medium line-clamp-1">
                    {description}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex-shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Opsi Mode Filter Utama */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-600" />
                  1. Pilih Periode Waktu / Cakupan Data
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs block">Semua Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterCategory('monthly')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      filterCategory === 'monthly'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs block">Filter Bulanan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterCategory('daily')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      filterCategory === 'daily'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs block">Filter Harian</span>
                  </button>
                </div>
              </div>

              {/* Detail Setting jika Monthly */}
              {filterCategory === 'monthly' && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Sub-Filter Bulanan:
                    </span>
                    <div className="flex gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setMonthlySubMode('single')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          monthlySubMode === 'single'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        1 Bulan
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonthlySubMode('range')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          monthlySubMode === 'range'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Rentang (A - D)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonthlySubMode('multiple')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          monthlySubMode === 'multiple'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Pilih Beberapa (A, C, E)
                      </button>
                    </div>
                  </div>

                  {monthlySubMode === 'single' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Pilih Bulan:
                      </label>
                      <input
                        type="month"
                        value={singleMonth}
                        onChange={e => setSingleMonth(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {monthlySubMode === 'range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Dari Bulan (A):
                        </label>
                        <input
                          type="month"
                          value={rangeMonthStart}
                          onChange={e => setRangeMonthStart(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Sampai Bulan (D):
                        </label>
                        <input
                          type="month"
                          value={rangeMonthEnd}
                          onChange={e => setRangeMonthEnd(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {monthlySubMode === 'multiple' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Centang Bulan yang Ingin Dicetak (A, C, E):
                      </label>
                      {availableMonths.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Tidak ada riwayat bulan khusus yang ditemukan dalam data.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl">
                          {availableMonths.map(m => {
                            const isChecked = selectedMonthsList.includes(m);
                            const label = new Date(m + '-01').toLocaleDateString(
                              'id-ID',
                              { month: 'short', year: 'numeric' }
                            );
                            return (
                              <label
                                key={m}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer font-semibold ${
                                  isChecked
                                    ? 'bg-blue-50 border-blue-400 text-blue-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleMonthCheck(m)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Detail Setting jika Daily */}
              {filterCategory === 'daily' && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Sub-Filter Harian:
                    </span>
                    <div className="flex gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setDailySubMode('single')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          dailySubMode === 'single'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        1 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailySubMode('range')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          dailySubMode === 'range'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Rentang (A - D)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailySubMode('multiple')}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                          dailySubMode === 'multiple'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Pilih Beberapa (A, C, E)
                      </button>
                    </div>
                  </div>

                  {dailySubMode === 'single' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Pilih Tanggal Spesifik:
                      </label>
                      <input
                        type="date"
                        value={singleDate}
                        onChange={e => setSingleDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {dailySubMode === 'range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Dari Tanggal (A):
                        </label>
                        <input
                          type="date"
                          value={rangeDateStart}
                          onChange={e => setRangeDateStart(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">
                          Sampai Tanggal (D):
                        </label>
                        <input
                          type="date"
                          value={rangeDateEnd}
                          onChange={e => setRangeDateEnd(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {dailySubMode === 'multiple' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-600 block">
                          Centang Tanggal yang Ingin Cetak (A, C, E):
                        </label>
                        <input
                          type="date"
                          onChange={e => {
                            if (
                              e.target.value &&
                              !selectedDatesList.includes(e.target.value)
                            ) {
                              setSelectedDatesList(prev => [...prev, e.target.value]);
                            }
                          }}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          title="Tambah Tanggal Baru"
                        />
                      </div>

                      {availableDates.length === 0 && selectedDatesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Pilih tanggal dari pemilih tanggal di atas.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl">
                          {Array.from(
                            new Set([...availableDates, ...selectedDatesList])
                          )
                            .sort((a, b) => b.localeCompare(a))
                            .map(d => {
                              const isChecked = selectedDatesList.includes(d);
                              const label = new Date(d).toLocaleDateString(
                                'id-ID',
                                { day: 'numeric', month: 'short', year: 'numeric' }
                              );
                              return (
                                <label
                                  key={d}
                                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer font-semibold ${
                                    isChecked
                                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleDateCheck(d)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Opsi Format File Export */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  2. Pilih Format Berkas Ekspor
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {allowedFormats.includes('pdf') && (
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('pdf')}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                        selectedFormat === 'pdf'
                          ? 'bg-red-50 border-red-500 text-red-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          selectedFormat === 'pdf'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block">Dokumen PDF (Kop Resmi)</span>
                        <span className="text-[10px] text-slate-500 block">
                          Disertai Kop BPMP & Tanda Tangan
                        </span>
                      </div>
                    </button>
                  )}

                  {allowedFormats.includes('excel') && (
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('excel')}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                        selectedFormat === 'excel'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          selectedFormat === 'excel'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block">Spreadsheet (CSV / Excel)</span>
                        <span className="text-[10px] text-slate-500 block">
                          Format data mentah (.csv)
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Box Live Preview Ringkasan Filter */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Ringkasan Hasil Filter:
                  </span>
                  <p className="text-xs font-bold text-amber-950">
                    {summaryText}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Total data yang akan diekspor:{' '}
                    <span className="font-bold underline">{filteredData.length} Record</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-amber-200/80 text-amber-900 font-extrabold text-xs rounded-xl uppercase tracking-wider inline-block">
                    {selectedFormat.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={filteredData.length === 0}
                className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                  filteredData.length === 0
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : selectedFormat === 'pdf'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedFormat === 'pdf' ? (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Lanjutkan Cetak PDF ({filteredData.length})</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh Excel / CSV ({filteredData.length})</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
