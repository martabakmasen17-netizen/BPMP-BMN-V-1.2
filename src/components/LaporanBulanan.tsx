/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  TrendingUp, 
  Activity,
  Layers,
  Search,
  CheckCircle2,
  CalendarDays,
  Info,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { BarangMasuk, BarangKeluar, Riwayat, Settings, Barang } from '../types';

export interface LaporanBulananProps {
  barangMasukList?: BarangMasuk[];
  barangKeluarList?: BarangKeluar[];
  riwayatList?: Riwayat[];
  barangList?: Barang[];
  settings?: Settings;
  onSelectDateDetail?: (dateStr: string) => void;
}

export interface RekapHarianItem {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Senin, Selasa, dll
  formattedDate: string; // 1 Agustus 2026
  isWeekend: boolean;
  isToday: boolean;
  
  // Masuk metrics
  countMasuk: number;
  volumeMasuk: number;
  itemsMasuk: Array<{ nama: string; jumlah: number; supplier?: string; id?: string }>;

  // Keluar metrics
  countKeluar: number;
  volumeKeluar: number;
  itemsKeluar: Array<{ nama: string; jumlah: number; unit?: string; id?: string }>;

  // Aggregate
  totalTrx: number;
  netVolume: number; // volumeMasuk - volumeKeluar
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function LaporanBulanan({
  barangMasukList = [],
  barangKeluarList = [],
  riwayatList = [],
  barangList = [],
  settings
}: LaporanBulananProps) {
  const currentDate = new Date();
  
  // State for selected Year and Month (1-12)
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [filterMode, setFilterMode] = useState<'all' | 'active_only' | 'weekdays' | 'weekend'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showChart, setShowChart] = useState<boolean>(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Derive dynamic list of years from transactions + current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentDate.getFullYear());
    yearsSet.add(currentDate.getFullYear() - 1);
    yearsSet.add(currentDate.getFullYear() + 1);

    barangMasukList.forEach(t => {
      if (t.tanggal) {
        const y = new Date(t.tanggal).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    barangKeluarList.forEach(t => {
      if (t.tanggal) {
        const y = new Date(t.tanggal).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    riwayatList.forEach(t => {
      if (t.tanggal) {
        const y = new Date(t.tanggal).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [barangMasukList, barangKeluarList, riwayatList]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
  };

  // --- CORE DATA PROCESSING ENGINE (PRECISION MONTH RECAP) ---
  const rekapData = useMemo(() => {
    // 1. Calculate EXACT days in the selected month (respects leap years, 28/29/30/31 days)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    // Boundary dates
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(selectedYear, selectedMonth - 1, daysInMonth, 23, 59, 59, 999);

    // 2. Filter inbound transactions for this exact month
    const filteredMasuk = barangMasukList.filter(t => {
      if (!t.tanggal) return false;
      const d = new Date(t.tanggal);
      return d >= startOfMonth && d <= endOfMonth;
    });

    // 3. Filter outbound transactions for this exact month (Approved or all recorded)
    const filteredKeluar = barangKeluarList.filter(t => {
      if (!t.tanggal) return false;
      const d = new Date(t.tanggal);
      return d >= startOfMonth && d <= endOfMonth && t.statusPersetujuan !== 'Ditolak';
    });

    // 4. Build daily breakdown array for day 1 through daysInMonth
    const dailyList: RekapHarianItem[] = [];
    const todayY = currentDate.getFullYear();
    const todayM = currentDate.getMonth() + 1;
    const todayD = currentDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = selectedYear === todayY && selectedMonth === todayM && day === todayD;

      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayName = NAMA_HARI[dayOfWeek];
      const formattedDate = `${day} ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`;

      // Inbound on this specific day
      const dayMasuk = filteredMasuk.filter(t => {
        const d = new Date(t.tanggal);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth && d.getDate() === day;
      });

      const countMasuk = dayMasuk.length;
      const volumeMasuk = dayMasuk.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const itemsMasuk = dayMasuk.map(t => ({
        nama: t.namaBarang,
        jumlah: t.jumlah,
        supplier: t.supplier,
        id: t.id
      }));

      // Outbound on this specific day
      const dayKeluar = filteredKeluar.filter(t => {
        const d = new Date(t.tanggal);
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth && d.getDate() === day;
      });

      const countKeluar = dayKeluar.length;
      const volumeKeluar = dayKeluar.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
      const itemsKeluar = dayKeluar.map(t => ({
        nama: t.namaBarang,
        jumlah: t.jumlah,
        unit: t.unitId,
        id: t.id
      }));

      const totalTrx = countMasuk + countKeluar;
      const netVolume = volumeMasuk - volumeKeluar;

      dailyList.push({
        dayNumber: day,
        dateStr,
        dayName,
        formattedDate,
        isWeekend,
        isToday,
        countMasuk,
        volumeMasuk,
        itemsMasuk,
        countKeluar,
        volumeKeluar,
        itemsKeluar,
        totalTrx,
        netVolume
      });
    }

    // 5. Calculate monthly macro statistics
    const totalTrxMasukBulanIni = filteredMasuk.length;
    const totalVolumeMasukBulanIni = filteredMasuk.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

    const totalTrxKeluarBulanIni = filteredKeluar.length;
    const totalVolumeKeluarBulanIni = filteredKeluar.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

    const totalMutasiVolume = totalVolumeMasukBulanIni + totalVolumeKeluarBulanIni;
    const netSaldoBulanIni = totalVolumeMasukBulanIni - totalVolumeKeluarBulanIni;
    const totalSemuaTransaksi = totalTrxMasukBulanIni + totalTrxKeluarBulanIni;

    const daysWithActivity = dailyList.filter(d => d.totalTrx > 0).length;

    // Peak active day
    let peakDay: RekapHarianItem | null = null;
    dailyList.forEach(d => {
      if (!peakDay || (d.volumeMasuk + d.volumeKeluar) > (peakDay.volumeMasuk + peakDay.volumeKeluar)) {
        if (d.totalTrx > 0) peakDay = d;
      }
    });

    return {
      daysInMonth,
      dailyList,
      totalTrxMasukBulanIni,
      totalVolumeMasukBulanIni,
      totalTrxKeluarBulanIni,
      totalVolumeKeluarBulanIni,
      totalMutasiVolume,
      netSaldoBulanIni,
      totalSemuaTransaksi,
      daysWithActivity,
      peakDay,
      periodLabel: `1 ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear} - ${daysInMonth} ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}`
    };
  }, [selectedYear, selectedMonth, barangMasukList, barangKeluarList]);

  // Filtered daily items based on user search and filter pills
  const filteredDailyList = useMemo(() => {
    return rekapData.dailyList.filter(item => {
      // Filter Mode
      if (filterMode === 'active_only' && item.totalTrx === 0) return false;
      if (filterMode === 'weekdays' && item.isWeekend) return false;
      if (filterMode === 'weekend' && !item.isWeekend) return false;

      // Search query (matches date number, day name, item names)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const dateMatch = item.dayNumber.toString().includes(q) || 
                          item.dayName.toLowerCase().includes(q) ||
                          item.formattedDate.toLowerCase().includes(q);
        
        const masukMatch = item.itemsMasuk.some(it => it.nama.toLowerCase().includes(q) || (it.supplier && it.supplier.toLowerCase().includes(q)));
        const keluarMatch = item.itemsKeluar.some(it => it.nama.toLowerCase().includes(q) || (it.unit && it.unit.toLowerCase().includes(q)));

        if (!dateMatch && !masukMatch && !keluarMatch) return false;
      }

      return true;
    });
  }, [rekapData.dailyList, filterMode, searchTerm]);

  // Chart data preparation
  const chartData = useMemo(() => {
    return rekapData.dailyList.map(item => ({
      name: `Tgl ${item.dayNumber}`,
      dayShort: `${item.dayNumber}`,
      fullDate: item.formattedDate,
      Masuk: item.volumeMasuk,
      Keluar: item.volumeKeluar,
      Net: item.netVolume,
      Trx: item.totalTrx
    }));
  }, [rekapData.dailyList]);

  // --- EXPORT TO CSV / EXCEL ---
  const handleExportCSV = () => {
    const headers = 'No,Tanggal,Hari,Jumlah Trx Masuk,Volume Masuk (Unit),Jumlah Trx Keluar,Volume Keluar (Unit),Net Mutasi,Rincian Masuk,Rincian Keluar\n';
    
    const rows = rekapData.dailyList.map(d => {
      const rincianMasuk = d.itemsMasuk.map(i => `${i.nama} (${i.jumlah})`).join('; ') || '-';
      const rincianKeluar = d.itemsKeluar.map(i => `${i.nama} (${i.jumlah} ke ${i.unit || 'Unit'})`).join('; ') || '-';
      
      return `${d.dayNumber},"${d.formattedDate}","${d.dayName}",${d.countMasuk},${d.volumeMasuk},${d.countKeluar},${d.volumeKeluar},${d.netVolume},"${rincianMasuk.replace(/"/g, '""')}","${rincianKeluar.replace(/"/g, '""')}"`;
    }).join('\n');

    const totalRow = `\n"TOTAL","${rekapData.periodLabel}","31 Hari",${rekapData.totalTrxMasukBulanIni},${rekapData.totalVolumeMasukBulanIni},${rekapData.totalTrxKeluarBulanIni},${rekapData.totalVolumeKeluarBulanIni},${rekapData.netSaldoBulanIni},"",""`;

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + rows + totalRow);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Laporan_Rekap_Bulanan_BMN_${NAMA_BULAN[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PRINT OFFICIAL PDF REPORT ---
  const handlePrintOfficialPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subHeaderKop = settings?.subHeaderKop || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI';
    const namaInstansi = settings?.namaInstitusi || 'BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI SUMATERA SELATAN';
    const alamatKop = settings?.alamatKop || 'Jl. Jenderal Sudirman Km. 6.5 Palembang Telp. (0711) 356789 Fax. 356790';
    const kontakKop = settings?.kontakKop || 'Email: bpmp.sumsel@kemdikbud.go.id | Laman: bpmp-sumsel.kemdikbud.go.id';
    const namaPj = settings?.namaPenanggungJawab || 'Ilham Muharrama';
    const jabatanPj = settings?.jabatanPenanggungJawab || 'Administrator / Petugas Pengelola BMN';
    const nipPj = settings?.nipPenanggungJawab || '-';

    const todayPrintedStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rowsHtml = rekapData.dailyList.map(d => {
      const isWeekendRow = d.isWeekend ? 'background-color: #fafafa;' : '';
      const rincianMasuk = d.itemsMasuk.length > 0 
        ? d.itemsMasuk.map(i => `${i.nama} (<b>+${i.jumlah}</b>)`).join('<br/>') 
        : '-';
      const rincianKeluar = d.itemsKeluar.length > 0 
        ? d.itemsKeluar.map(i => `${i.nama} (<b>-${i.jumlah}</b> ${i.unit ? 'ke ' + i.unit : ''})`).join('<br/>') 
        : '-';

      const netBadge = d.netVolume > 0 
        ? `<span style="color: #047857; font-weight: bold;">+${d.netVolume}</span>`
        : d.netVolume < 0 
          ? `<span style="color: #b91c1c; font-weight: bold;">${d.netVolume}</span>`
          : '<span style="color: #6b7280;">0</span>';

      return `
        <tr style="${isWeekendRow}">
          <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${d.dayNumber}</td>
          <td style="border: 1px solid #333; padding: 6px;">${d.dayName}, ${d.dayNumber} ${NAMA_BULAN[selectedMonth - 1]}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${d.countMasuk > 0 ? d.countMasuk + ' Trx' : '-'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; color: #047857;">${d.volumeMasuk > 0 ? '+' + d.volumeMasuk : '-'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${d.countKeluar > 0 ? d.countKeluar + ' Trx' : '-'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; color: #b91c1c;">${d.volumeKeluar > 0 ? '-' + d.volumeKeluar : '-'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${netBadge}</td>
          <td style="border: 1px solid #333; padding: 6px; font-size: 10px; line-height: 1.3;">${rincianMasuk}</td>
          <td style="border: 1px solid #333; padding: 6px; font-size: 10px; line-height: 1.3;">${rincianKeluar}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Rekapitulasi Bulanan BMN - ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 30px 40px; color: black; line-height: 1.3; font-size: 11px; }
            .kop { text-align: center; border-bottom: 3px double black; padding-bottom: 8px; margin-bottom: 15px; }
            .kop h2 { margin: 0; font-size: 13px; text-transform: uppercase; font-weight: normal; }
            .kop h1 { margin: 4px 0; font-size: 16px; text-transform: uppercase; font-weight: bold; }
            .kop p { margin: 2px 0; font-size: 10px; }
            .meta { text-align: center; margin-bottom: 18px; }
            .meta h3 { margin: 0 0 4px 0; font-size: 14px; text-transform: uppercase; text-decoration: underline; }
            .meta span { display: block; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
            th { border: 1px solid black; padding: 6px 4px; background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .total-row td { border: 1px solid black; padding: 8px 4px; font-weight: bold; background-color: #e5e7eb; }
            .summary-box { width: 100%; border: 1px solid black; margin-bottom: 20px; padding: 10px; font-size: 11px; display: table; }
            .summary-item { display: table-cell; width: 25%; text-align: center; border-right: 1px solid #ccc; }
            .summary-item:last-child { border-right: none; }
            .signature-block { width: 100%; margin-top: 30px; font-size: 11px; }
            .signature-block table { border: none; font-size: 11px; margin: 0; }
            .signature-block td { border: none; padding: 0; }
            @media print { 
              .no-print { display: none; } 
              @page { size: landscape; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="kop">
            <h2>${subHeaderKop}</h2>
            <h1>${namaInstansi}</h1>
            <p>${alamatKop}</p>
            <p>${kontakKop}</p>
          </div>

          <div class="meta">
            <h3>LAPORAN REKAPITULASI MUTASI BARANG BMN PER HARI</h3>
            <span><strong>Periode Bulan:</strong> ${NAMA_BULAN[selectedMonth - 1]} ${selectedYear} (${rekapData.periodLabel})</span>
            <span><strong>Waktu Cetak:</strong> ${todayPrintedStr}</span>
          </div>

          <div class="summary-box">
            <div class="summary-item">
              <strong>Total Transaksi Masuk</strong><br/>
              <span style="font-size: 13px; color: #047857; font-weight: bold;">${rekapData.totalTrxMasukBulanIni} Trx (${rekapData.totalVolumeMasukBulanIni} Unit)</span>
            </div>
            <div class="summary-item">
              <strong>Total Transaksi Keluar</strong><br/>
              <span style="font-size: 13px; color: #b91c1c; font-weight: bold;">${rekapData.totalTrxKeluarBulanIni} Trx (${rekapData.totalVolumeKeluarBulanIni} Unit)</span>
            </div>
            <div class="summary-item">
              <strong>Net Mutasi Bersih</strong><br/>
              <span style="font-size: 13px; font-weight: bold;">${rekapData.netSaldoBulanIni >= 0 ? '+' : ''}${rekapData.netSaldoBulanIni} Unit</span>
            </div>
            <div class="summary-item">
              <strong>Hari Aktif Transaksi</strong><br/>
              <span style="font-size: 13px; font-weight: bold;">${rekapData.daysWithActivity} dari ${rekapData.daysInMonth} Hari</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">Tgl</th>
                <th style="width: 14%;">Hari & Tanggal</th>
                <th style="width: 8%;">Trx Masuk</th>
                <th style="width: 8%;">Vol Masuk</th>
                <th style="width: 8%;">Trx Keluar</th>
                <th style="width: 8%;">Vol Keluar</th>
                <th style="width: 8%;">Net Saldo</th>
                <th style="width: 25%;">Rincian Barang Masuk</th>
                <th style="width: 25%;">Rincian Barang Keluar</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align: right; padding-right: 10px;">REKAP TOTAL BULANAN</td>
                <td style="text-align: center;">${rekapData.totalTrxMasukBulanIni} Trx</td>
                <td style="text-align: center; color: #047857;">+${rekapData.totalVolumeMasukBulanIni} Unit</td>
                <td style="text-align: center;">${rekapData.totalTrxKeluarBulanIni} Trx</td>
                <td style="text-align: center; color: #b91c1c;">-${rekapData.totalVolumeKeluarBulanIni} Unit</td>
                <td style="text-align: center;">${rekapData.netSaldoBulanIni >= 0 ? '+' : ''}${rekapData.netSaldoBulanIni} Unit</td>
                <td colspan="2" style="text-align: center; font-size: 9px; font-style: italic;">Total ${rekapData.totalSemuaTransaksi} Transaksi Operasional Gudang</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-block">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 60%;"></td>
                <td style="width: 40%; text-align: center;">
                  Palembang, ${todayPrintedStr}<br/>
                  Mengetahui / Mengesahkan,<br/>
                  <strong>${jabatanPj}</strong>
                  <br/><br/><br/><br/><br/>
                  <u><strong>${namaPj}</strong></u><br/>
                  NIP. ${nipPj}
                </td>
              </tr>
            </table>
          </div>

          <br/>
          <button onclick="window.print()" class="no-print" style="padding: 10px 24px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: block; margin: 20px auto;">Cetak Laporan Resmi</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="laporan-bulanan-container">
      {/* --- HEADER CONTROL BAR & MONTH/YEAR PICKER --- */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Title & Active Period Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                Laporan Bulanan Rekapitulasi Harian
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                  Presisi Kalender
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Periode: <strong className="text-slate-700">{rekapData.periodLabel}</strong> ({rekapData.daysInMonth} Hari Penuh)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Dropdowns & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Month Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dropdown Bulan */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 text-xs px-2 py-1 focus:outline-none cursor-pointer"
            >
              {NAMA_BULAN.map((bln, idx) => (
                <option key={bln} value={idx + 1}>
                  {bln}
                </option>
              ))}
            </select>

            {/* Dropdown Tahun */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 text-xs px-2 py-1 border-l border-slate-200 focus:outline-none cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Button 'Bulan Ini' */}
          <button
            onClick={handleResetToCurrentMonth}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Bulan Ini
          </button>

          {/* Print PDF Button */}
          <button
            onClick={handlePrintOfficialPDF}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF Resmi
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export Excel/CSV
          </button>
        </div>

      </div>

      {/* --- KPI SUMMARY ROW FOR SELECTED MONTH --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Masuk */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Barang Masuk</span>
              <span className="text-2xl font-black text-emerald-900 block mt-0.5 tracking-tight">
                +{rekapData.totalVolumeMasukBulanIni} <span className="text-xs font-bold text-emerald-600">Unit</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {rekapData.totalTrxMasukBulanIni} Transaksi Penerimaan
              </span>
            </div>
          </div>
        </div>

        {/* Total Keluar */}
        <div className="bg-gradient-to-br from-white to-rose-50/40 p-4 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Barang Keluar</span>
              <span className="text-2xl font-black text-rose-900 block mt-0.5 tracking-tight">
                -{rekapData.totalVolumeKeluarBulanIni} <span className="text-xs font-bold text-rose-600">Unit</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {rekapData.totalTrxKeluarBulanIni} Transaksi Distribusi
              </span>
            </div>
          </div>
        </div>

        {/* Net Mutasi Saldo */}
        <div className="bg-gradient-to-br from-white to-blue-50/40 p-4 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Net Mutasi Saldo</span>
              <span className={`text-2xl font-black block mt-0.5 tracking-tight ${rekapData.netSaldoBulanIni >= 0 ? 'text-blue-900' : 'text-amber-800'}`}>
                {rekapData.netSaldoBulanIni >= 0 ? `+${rekapData.netSaldoBulanIni}` : rekapData.netSaldoBulanIni} <span className="text-xs font-bold text-slate-400">Unit</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {rekapData.netSaldoBulanIni >= 0 ? 'Surplus Penambahan Stok' : 'Defisit Pengurangan Stok'}
              </span>
            </div>
          </div>
        </div>

        {/* Aktivitas & Hari Tersibuk */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-200/70 text-slate-700 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Aktivitas Operasional</span>
              <span className="text-2xl font-black text-slate-800 block mt-0.5 tracking-tight">
                {rekapData.daysWithActivity} <span className="text-xs font-bold text-slate-400">/ {rekapData.daysInMonth} Hari</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate block" title={rekapData.peakDay ? `Puncak: ${rekapData.peakDay.formattedDate}` : 'Tidak ada mutasi'}>
                {rekapData.peakDay ? `Puncak: Tgl ${rekapData.peakDay.dayNumber} (${rekapData.peakDay.volumeMasuk + rekapData.peakDay.volumeKeluar} unit)` : 'Gudang Tenang'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* --- VISUAL CHART PREVIEW (TOGGLEABLE) --- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Grafik Fluktuasi Harian (1 - {rekapData.daysInMonth} {NAMA_BULAN[selectedMonth - 1]} {selectedYear})
            </h3>
          </div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {showChart ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
          </button>
        </div>

        {showChart && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="dayShort" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                  formatter={(val: any, name: any) => [`${val} Unit`, name === 'Masuk' ? 'Barang Masuk' : 'Barang Keluar']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || `Tanggal ${label}`}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(val) => <span className="text-xs font-bold text-slate-700">{val === 'Masuk' ? 'Barang Masuk (Unit)' : 'Barang Keluar (Unit)'}</span>}
                />
                <Bar dataKey="Masuk" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Keluar" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- REKAPITULASI TABEL HARIAN --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filter and Search Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua ({rekapData.daysInMonth} Hari)
            </button>
            <button
              onClick={() => setFilterMode('active_only')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'active_only'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Ada Transaksi ({rekapData.daysWithActivity})
            </button>
            <button
              onClick={() => setFilterMode('weekdays')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'weekdays'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hari Kerja (Senin-Jumat)
            </button>
            <button
              onClick={() => setFilterMode('weekend')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'weekend'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Akhir Pekan
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari tanggal atau barang..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

        </div>

        {/* Main Daily Data Table */}
        {/* DESKTOP / TABLET TABLE VIEW (Visible on >= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 text-center w-12">Tgl</th>
                <th className="p-3.5 min-w-[150px]">Hari & Tanggal</th>
                <th className="p-3.5 text-center min-w-[110px]">Barang Masuk</th>
                <th className="p-3.5 text-center min-w-[110px]">Barang Keluar</th>
                <th className="p-3.5 text-center min-w-[100px]">Net Saldo</th>
                <th className="p-3.5 min-w-[280px]">Rincian Item / Log Operasional</th>
                <th className="p-3.5 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDailyList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calendar className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs font-semibold text-slate-500">Tidak ada data harian yang cocok dengan filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDailyList.map(item => {
                  const isExpanded = expandedDay === item.dayNumber;
                  const hasActivity = item.totalTrx > 0;

                  return (
                    <React.Fragment key={item.dateStr}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${
                        item.isToday 
                          ? 'bg-blue-50/40 font-semibold' 
                          : item.isWeekend 
                            ? 'bg-slate-50/30' 
                            : ''
                      }`}>
                        
                        {/* Day Number */}
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            item.isToday
                              ? 'bg-blue-600 text-white shadow-sm'
                              : hasActivity
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.dayNumber}
                          </span>
                        </td>

                        {/* Full Date & Badges */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">
                                {item.dayName}, {item.dayNumber} {NAMA_BULAN[selectedMonth - 1]}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.dateStr}
                              </span>
                            </div>
                            {item.isToday && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-md">
                                Hari Ini
                              </span>
                            )}
                            {item.isWeekend && (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-medium rounded-md">
                                Libur
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Masuk Stats */}
                        <td className="p-3 text-center">
                          {item.volumeMasuk > 0 ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md text-xs">
                                +{item.volumeMasuk} Unit
                              </span>
                              <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
                                {item.countMasuk} Trx
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-medium">-</span>
                          )}
                        </td>

                        {/* Keluar Stats */}
                        <td className="p-3 text-center">
                          {item.volumeKeluar > 0 ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 font-black rounded-md text-xs">
                                -{item.volumeKeluar} Unit
                              </span>
                              <span className="block text-[10px] text-rose-600 font-medium mt-0.5">
                                {item.countKeluar} Trx
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-medium">-</span>
                          )}
                        </td>

                        {/* Net Saldo */}
                        <td className="p-3 text-center">
                          {hasActivity ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-block ${
                              item.netVolume > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.netVolume < 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.netVolume > 0 ? `+${item.netVolume}` : item.netVolume}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">0</span>
                          )}
                        </td>

                        {/* Activity Summary Chips */}
                        <td className="p-3">
                          {hasActivity ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.itemsMasuk.slice(0, 2).map((m, i) => (
                                <span key={`m-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-md text-[10px] font-medium">
                                  <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="truncate max-w-[120px]">{m.nama}</span>
                                  <span className="font-bold">+{m.jumlah}</span>
                                </span>
                              ))}
                              {item.itemsKeluar.slice(0, 2).map((k, i) => (
                                <span key={`k-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-md text-[10px] font-medium">
                                  <ArrowUpRight className="w-2.5 h-2.5 text-rose-600" />
                                  <span className="truncate max-w-[120px]">{k.nama}</span>
                                  <span className="font-bold">-{k.jumlah}</span>
                                </span>
                              ))}
                              {(item.itemsMasuk.length + item.itemsKeluar.length) > 4 && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  +{item.itemsMasuk.length + item.itemsKeluar.length - 4} item lagi
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Tidak ada transaksi</span>
                          )}
                        </td>

                        {/* Expand Action */}
                        <td className="p-3 text-center">
                          {hasActivity ? (
                            <button
                              onClick={() => setExpandedDay(isExpanded ? null : item.dayNumber)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                              title="Lihat Detail Transaksi"
                            >
                              {isExpanded ? 'Tutup' : 'Rincian'}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[10px]">-</span>
                          )}
                        </td>

                      </tr>

                      {/* Expandable detailed row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-y border-slate-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Rincian Lengkap Transaksi Tanggal {item.formattedDate}
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {/* Masuk details */}
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <ArrowDownLeft className="w-3.5 h-3.5" /> Penerimaan Barang Masuk ({item.itemsMasuk.length})
                                  </span>
                                  {item.itemsMasuk.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Tidak ada barang masuk pada tanggal ini.</p>
                                  ) : (
                                    <ul className="space-y-1.5">
                                      {item.itemsMasuk.map((m, idx) => (
                                        <li key={idx} className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs flex items-center justify-between">
                                          <div>
                                            <span className="font-bold text-slate-800">{m.nama}</span>
                                            {m.supplier && <span className="block text-[10px] text-slate-500">Penyedia: {m.supplier}</span>}
                                          </div>
                                          <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                            +{m.jumlah}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                {/* Keluar details */}
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Distribusi Barang Keluar ({item.itemsKeluar.length})
                                  </span>
                                  {item.itemsKeluar.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Tidak ada barang keluar pada tanggal ini.</p>
                                  ) : (
                                    <ul className="space-y-1.5">
                                      {item.itemsKeluar.map((k, idx) => (
                                        <li key={idx} className="p-2 bg-rose-50/60 border border-rose-100 rounded-lg text-xs flex items-center justify-between">
                                          <div>
                                            <span className="font-bold text-slate-800">{k.nama}</span>
                                            {k.unit && <span className="block text-[10px] text-slate-500">Unit: {k.unit}</span>}
                                          </div>
                                          <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                            -{k.jumlah}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            
            {/* Sticky/Prominent Footer Totals */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td colSpan={2} className="p-4 text-left">
                  <div className="font-bold uppercase tracking-wider text-[11px]">
                    TOTAL REKAPITULASI {NAMA_BULAN[selectedMonth - 1].toUpperCase()} {selectedYear}
                  </div>
                  <div className="text-[10px] font-normal text-slate-400">
                    Periode Penuh ({rekapData.daysInMonth} Hari Kalender)
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="text-emerald-400 font-black text-sm block">
                    +{rekapData.totalVolumeMasukBulanIni} Unit
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {rekapData.totalTrxMasukBulanIni} Transaksi
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="text-rose-400 font-black text-sm block">
                    -{rekapData.totalVolumeKeluarBulanIni} Unit
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {rekapData.totalTrxKeluarBulanIni} Transaksi
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`text-sm font-black block ${rekapData.netSaldoBulanIni >= 0 ? 'text-blue-300' : 'text-amber-300'}`}>
                    {rekapData.netSaldoBulanIni >= 0 ? `+${rekapData.netSaldoBulanIni}` : rekapData.netSaldoBulanIni} Unit
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Net Saldo
                  </span>
                </td>
                <td colSpan={2} className="p-4 text-right pr-6">
                  <span className="text-[11px] text-slate-300 block">
                    Total {rekapData.totalSemuaTransaksi} Transaksi Mutasi
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {rekapData.daysWithActivity} Hari Aktif Transaksi Gudang
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Visible on < 640px) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredDailyList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Calendar className="w-8 h-8 text-slate-300 stroke-1 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Tidak ada data harian yang cocok</p>
            </div>
          ) : (
            filteredDailyList.map(item => {
              const isExpanded = expandedDay === item.dayNumber;
              const hasActivity = item.totalTrx > 0;

              return (
                <div
                  key={`mobile_day_${item.dateStr}`}
                  className={`p-4 space-y-3 transition-colors ${
                    item.isToday ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Top: Day badge, Date, and Net Saldo */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold ${
                        item.isToday
                          ? 'bg-blue-600 text-white shadow-sm'
                          : hasActivity
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.dayNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.dayName}, {item.dayNumber} {NAMA_BULAN[selectedMonth - 1]}
                          </span>
                          {item.isToday && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">
                              Hari Ini
                            </span>
                          )}
                          {item.isWeekend && (
                            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 text-[9px] font-medium rounded">
                              Libur
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.dateStr}</span>
                      </div>
                    </div>

                    {hasActivity && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.netVolume > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.netVolume < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.netVolume > 0 ? `+${item.netVolume}` : item.netVolume} Net
                      </span>
                    )}
                  </div>

                  {/* Volume Masuk & Keluar Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Barang Masuk</span>
                      <span className="font-extrabold text-emerald-900 text-sm block mt-0.5">
                        +{item.volumeMasuk} <span className="text-[10px] font-normal text-emerald-700">Unit</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium block">
                        {item.countMasuk} Transaksi
                      </span>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">Barang Keluar</span>
                      <span className="font-extrabold text-rose-900 text-sm block mt-0.5">
                        -{item.volumeKeluar} <span className="text-[10px] font-normal text-rose-700">Unit</span>
                      </span>
                      <span className="text-[10px] text-rose-600 font-medium block">
                        {item.countKeluar} Transaksi
                      </span>
                    </div>
                  </div>

                  {/* Item Chips Preview or Expand Toggle */}
                  {hasActivity ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : item.dayNumber)}
                        className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Tutup Rincian Harian' : `Lihat Rincian (${item.totalTrx} Transaksi)`}
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 text-xs">
                          {item.itemsMasuk.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                📥 Masuk ({item.itemsMasuk.length})
                              </span>
                              <div className="space-y-1">
                                {item.itemsMasuk.map((m, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-800">{m.nama}</span>
                                    <span className="font-bold text-emerald-700">+{m.jumlah}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.itemsKeluar.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                                📤 Keluar ({item.itemsKeluar.length})
                              </span>
                              <div className="space-y-1">
                                {item.itemsKeluar.map((k, idx) => (
                                  <div key={idx} className="p-2 bg-white rounded-lg border border-rose-100 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-medium text-slate-800 block">{k.nama}</span>
                                      {k.unit && <span className="text-[10px] text-slate-400">{k.unit}</span>}
                                    </div>
                                    <span className="font-bold text-rose-700">-{k.jumlah}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic text-center py-1">
                      Tidak ada transaksi pada tanggal ini
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Mobile Footer Rekapitulasi Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-b-2xl space-y-2 text-xs">
            <div className="font-bold uppercase text-[11px] tracking-wider text-slate-200">
              REKAP TOTAL {NAMA_BULAN[selectedMonth - 1]} {selectedYear}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Masuk:</span>
                <span className="font-bold text-emerald-400">+{rekapData.totalVolumeMasukBulanIni}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Keluar:</span>
                <span className="font-bold text-rose-400">-{rekapData.totalVolumeKeluarBulanIni}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Net Saldo:</span>
                <span className={`font-bold ${rekapData.netSaldoBulanIni >= 0 ? 'text-blue-300' : 'text-amber-300'}`}>
                  {rekapData.netSaldoBulanIni >= 0 ? `+${rekapData.netSaldoBulanIni}` : rekapData.netSaldoBulanIni}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
