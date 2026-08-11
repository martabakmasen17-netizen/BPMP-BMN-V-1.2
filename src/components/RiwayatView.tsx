/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, ArrowDownLeft, ArrowUpRight, History, Download, FileSpreadsheet, Printer, Trash2, ShieldAlert, Check, X } from 'lucide-react';
import { Riwayat, Settings, Barang } from '../types';
import ExportConfirmModal, { ExportFormat } from './ExportConfirmModal';

interface RiwayatViewProps {
  riwayat: Riwayat[];
  barang?: Barang[];
  settings?: Settings;
  currentUserRole?: string;
  onDeleteRiwayat?: (ids: string[]) => void;
}

export default function RiwayatView({ riwayat, barang = [], settings, currentUserRole, onDeleteRiwayat }: RiwayatViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOfficialBMNExportModal, setShowOfficialBMNExportModal] = useState(false);

  const isAdmin = currentUserRole === 'Administrator';

  const subHeaderKop = settings?.subHeaderKop || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI';
  const namaInstansi = settings?.namaInstitusi || 'BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI SUMATERA SELATAN';
  const alamatKop = settings?.alamatKop || 'Jl. Jenderal Sudirman Km. 6.5 Palembang Telp. (0711) 356789 Fax. 356790';
  const kontakKop = settings?.kontakKop || 'Email: bpmp.sumsel@kemdikbud.go.id | Laman: bpmp-sumsel.kemdikbud.go.id';
  const namaPj = settings?.namaPenanggungJawab || 'Ilham Muharrama';
  const jabatanPj = settings?.jabatanPenanggungJawab || 'Administrator / Petugas BMN';
  const nipPj = settings?.nipPenanggungJawab || '-';

  // Extract unique month-year options from riwayat list (e.g. "2026-07")
  const availableMonths = Array.from(
    new Set(
      riwayat
        .map(r => (r.tanggal ? r.tanggal.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  const filteredRiwayat = riwayat.filter(item => {
    const matchesSearch =
      String(item.namaBarang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.barangId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.petugas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ? true : item.tipe.toLowerCase() === filterType.toLowerCase();

    const matchesMonth =
      selectedMonth === 'all' ? true : item.tanggal && item.tanggal.startsWith(selectedMonth);

    return matchesSearch && matchesType && matchesMonth;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRiwayat.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = () => {
    if (onDeleteRiwayat && selectedIds.length > 0) {
      onDeleteRiwayat(selectedIds);
      setSelectedIds([]);
      setShowDeleteConfirmModal(false);
    }
  };

  const executePrintPDF = (data: Riwayat[], summaryText: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const totalMasuk = data
      .filter(r => r.tipe === 'Masuk')
      .reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
    
    const totalKeluar = data
      .filter(r => r.tipe === 'Keluar')
      .reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);

    const rows = data
      .map((r, i) => {
        const isMasuk = r.tipe === 'Masuk';
        const formattedDate = new Date(r.tanggal).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const formattedTime = new Date(r.tanggal).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <tr>
            <td style="text-align: center; border: 1px solid black; padding: 6px;">${i + 1}</td>
            <td style="text-align: center; border: 1px solid black; padding: 6px; font-family: monospace; font-size: 10px;">${r.id}</td>
            <td style="text-align: center; border: 1px solid black; padding: 6px;">${formattedDate}<br/><span style="font-size: 9px; color: #555;">${formattedTime} WIB</span></td>
            <td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold; color: ${isMasuk ? '#15803d' : '#b91c1c'};">
              ${isMasuk ? 'MASUK (+)' : 'KELUAR (-)'}
            </td>
            <td style="text-align: center; border: 1px solid black; padding: 6px; font-family: monospace; font-size: 10px;">${r.barangId}</td>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${r.namaBarang}</td>
            <td style="text-align: center; border: 1px solid black; padding: 6px; font-weight: bold; color: ${isMasuk ? '#15803d' : '#b91c1c'};">
              ${isMasuk ? '+' : '-'}${r.jumlah}
            </td>
            <td style="border: 1px solid black; padding: 6px;">${r.petugas || '-'}</td>
            <td style="border: 1px solid black; padding: 6px; font-size: 10px;">${r.keterangan || '-'}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Riwayat Mutasi BMN - BPMP Sumsel</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 30px; color: black; line-height: 1.4; }
            .kop { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px; }
            .kop h2 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: normal; }
            .kop h1 { margin: 5px 0; font-size: 17px; text-transform: uppercase; font-weight: bold; }
            .kop p { margin: 2px 0; font-size: 11px; }
            .meta { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            .meta span { display: block; margin-top: 4px; font-size: 11px; font-weight: normal; text-transform: none; }
            .filter-info { font-size: 11px; font-style: italic; margin-bottom: 10px; color: #444; }
            table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 25px; }
            th { border: 1px solid black; padding: 7px 5px; background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 10px; }
            .total-row td { border: 1px solid black; padding: 6px; font-weight: bold; background-color: #fafafa; }
            .signature-block { width: 100%; margin-top: 40px; font-size: 11.5px; page-break-inside: avoid; }
            .signature-block table { border: none; font-size: 11.5px; margin: 0; }
            .signature-block td { border: none; padding: 0; }
            @media print { .no-print { display: none; } }
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
            LAPORAN BUKU RIWAYAT MUTASI PERSEDIAAN BARANG BMN
            <span>(BUKU BESAR SIRKULASI BARANG MASUK & BARANG KELUAR)</span>
            <span>Periode Data: ${summaryText}</span>
            <span>Per Tanggal Cetak: ${todayDate} • Total Catatan: ${data.length} Transaksi</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%">No</th>
                <th style="width: 12%">ID Transaksi</th>
                <th style="width: 13%">Tanggal & Waktu</th>
                <th style="width: 10%">Jenis</th>
                <th style="width: 14%">Kode Barang</th>
                <th style="width: 20%">Nama Barang</th>
                <th style="width: 7%">Volume</th>
                <th style="width: 10%">Petugas</th>
                <th style="width: 10%">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows : '<tr><td colspan="9" style="text-align:center; padding: 15px;">Tidak ada data mutasi yang sesuai filter.</td></tr>'}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">TOTAL VOLUME MUTASI MASUK (+)</td>
                <td style="text-align: center; color: #15803d;">+${totalMasuk}</td>
                <td colspan="2"></td>
              </tr>
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">TOTAL VOLUME MUTASI KELUAR (-)</td>
                <td style="text-align: center; color: #b91c1c;">-${totalKeluar}</td>
                <td colspan="2"></td>
              </tr>
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">AKUMULASI NETTO SISA MUTASI</td>
                <td style="text-align: center; color: #1e40af;">${totalMasuk - totalKeluar >= 0 ? '+' : ''}${totalMasuk - totalKeluar}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>

          <div class="signature-block">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 60%;"></td>
                <td style="width: 40%; text-align: center;">
                  Palembang, ${todayDate}<br/>
                  Mengetahui,<br/>
                  <strong>${jabatanPj}</strong>
                  <br/><br/><br/><br/><br/>
                  <u><strong>${namaPj}</strong></u><br/>
                  NIP. ${nipPj}
                </td>
              </tr>
            </table>
          </div>

          <br/><br/>
          <button onclick="window.print()" class="no-print" style="padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: block; margin: 0 auto;">Cetak Laporan PDF</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const executeExportCSV = (data: Riwayat[], summaryText: string) => {
    // Generate actual CSV content
    const headers = 'ID Transaksi,Tanggal,Tipe,Kode Barang,Nama Barang,Jumlah,Petugas,Keterangan\n';
    const rows = data
      .map(
        r =>
          `"${r.id}","${new Date(r.tanggal).toLocaleDateString()}","${r.tipe}","${r.barangId}","${
            r.namaBarang
          }",${r.tipe === 'Masuk' ? '+' : '-'}${r.jumlah},"${r.petugas}","${(r.keterangan || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Riwayat_Mutasi_BMN_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executePrintOfficialBMNSummaryPDF = (filteredMutasi: Riwayat[], summaryText: string, dateRange?: {start: string, end: string}) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const currentYear = new Date().getFullYear();
    const currentMonthDateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    let periodEndStr = todayDate.toUpperCase();
    let periodStartDisplay = `01-01-${currentYear}`;
    let periodEndDisplay = todayDate;

    if (dateRange) {
        const endDate = new Date(dateRange.end);
        if (!isNaN(endDate.getTime())) {
            periodEndDisplay = endDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');
            periodEndStr = endDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
        }
        
        const startDate = new Date(dateRange.start);
        if (!isNaN(startDate.getTime())) {
            periodStartDisplay = startDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');
        }
    }

    const uapb = settings?.uapb || 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH';
    const uappbE1 = settings?.uappbE1 || 'DIREKTORAT JENDERAL PENDIDIKAN ANAK USIA DINI, PENDIDIKAN DASAR, DAN PENDIDIKAN MENENGAH';
    const uappbW = settings?.uappbW || 'BA(138) ES1(04) SUMATERA SELATAN';
    const namaUakpb = settings?.namaInstitusi || 'BPMP PROVINSI SUMATERA SELATAN';
    const kodeUakpb = settings?.kodeUakpb || '138.04.1100.693243';

    // Group master barang items by category preserving catalog order
    const categoriesMap = new Map<string, Barang[]>();
    (barang || []).forEach(item => {
      const catName = item.kategori || 'LAIN-LAIN';
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, []);
      }
      categoriesMap.get(catName)!.push(item);
    });

    let tableRowsHtml = '';

    categoriesMap.forEach((items, catName) => {
      // Category Header Row
      tableRowsHtml += `
        <tr class="cat-row">
          <td style="border: 1px solid black; padding: 4px 6px; font-weight: bold;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; font-weight: bold; color: #1e40af;">${catName.toUpperCase()}</td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: right; font-weight: bold;">0</td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: center;"></td>
          <td style="border: 1px solid black; padding: 4px 6px; text-align: right; font-weight: bold;">0</td>
        </tr>
      `;

      items.forEach((b) => {
        const itemMutasi = filteredMutasi.filter(r => r.barangId === b.id || r.namaBarang === b.nama);
        const masuk = itemMutasi.filter(r => r.tipe === 'Masuk').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const keluar = itemMutasi.filter(r => r.tipe === 'Keluar').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const mutasiNet = masuk - keluar;
        
        let mutasiNetAfter = 0;
        if (dateRange) {
          const allItemMutasi = riwayat.filter(r => r.barangId === b.id || r.namaBarang === b.nama);
          const mutasiAfterEnd = allItemMutasi.filter(r => r.tanggal > dateRange.end + 'T23:59:59Z');
          const masukAfter = mutasiAfterEnd.filter(r => r.tipe === 'Masuk').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
          const keluarAfter = mutasiAfterEnd.filter(r => r.tipe === 'Keluar').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
          mutasiNetAfter = masukAfter - keluarAfter;
        }

        const stokSekarangReal = Number(b.stokSekarang) || 0;
        const stokAkhir = stokSekarangReal - mutasiNetAfter;
        const stokAwal = Math.max(0, stokAkhir - mutasiNet);

        // Display code (formatted sequence like 000001)
        const parts = b.id.split('-');
        const rawCode = parts.length > 1 ? parts[1] : b.id;
        const displayCode = rawCode.padStart(6, '0');

        tableRowsHtml += `
          <tr>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${displayCode}</td>
            <td style="border: 1px solid black; padding: 4px 6px;">${b.nama}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${stokAwal}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: right;">0</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${masuk}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${keluar}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${mutasiNet}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: center;">${stokAkhir}</td>
            <td style="border: 1px solid black; padding: 4px 6px; text-align: right;">0</td>
          </tr>
        `;
      });
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Rincian Barang Persediaan - ${namaUakpb}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8pt;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            .header-meta {
              font-size: 8pt;
              font-weight: normal;
              line-height: 1.4;
              margin-bottom: 12px;
            }
            .header-meta table {
              width: 100%;
              border-collapse: collapse;
            }
            .header-meta td {
              border: none;
              padding: 1px 0;
              font-size: 8pt;
            }
            .title-section {
              text-align: center;
              font-weight: bold;
              font-size: 11pt;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .title-section .subtitle {
              font-size: 9.5pt;
              margin-top: 3px;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8pt;
            }
            table.data-table th, table.data-table td {
              border: 1px solid #000;
              padding: 4px 5px;
            }
            table.data-table th {
              background-color: #f1f5f9;
              text-align: center;
              font-weight: bold;
              font-size: 7.5pt;
              text-transform: uppercase;
            }
            tr.cat-row {
              background-color: #f8fafc;
              font-weight: bold;
            }
            .footer-section {
              margin-top: 25px;
              width: 100%;
              font-size: 8.5pt;
              page-break-inside: avoid;
            }
            .footer-section table {
              width: 100%;
              border-collapse: collapse;
            }
            .footer-section td {
              border: none;
              vertical-align: top;
            }
          </style>
        </head>
        <body>
          <div class="header-meta">
            <table>
              <tr>
                <td style="width: 100px;">UAPB</td>
                <td style="width: 15px;">:</td>
                <td>${uapb}</td>
              </tr>
              <tr>
                <td>UAPPB-E1</td>
                <td>:</td>
                <td>${uappbE1}</td>
              </tr>
              <tr>
                <td>UAPPB-W</td>
                <td>:</td>
                <td>${uappbW}</td>
              </tr>
            </table>
          </div>

          <div class="title-section">
            LAPORAN RINCIAN BARANG PERSEDIAAN<br/>
            <div class="subtitle">
              UNTUK PERIODE YANG BERAKHIR TANGGAL ${periodEndStr}<br/>
              TAHUN ANGGARAN : ${currentYear}
            </div>
          </div>

          <div class="header-meta" style="margin-bottom: 8px;">
            <table>
              <tr>
                <td style="width: 110px;">NAMA UAKPB</td>
                <td style="width: 15px;">:</td>
                <td>${namaUakpb}</td>
              </tr>
              <tr>
                <td>KODE UAKPB</td>
                <td>:</td>
                <td>${kodeUakpb}</td>
              </tr>
            </table>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2" style="width: 65px;">KODE</th>
                <th rowspan="2">URAIAN</th>
                <th colspan="2">NILAI<br/><span style="font-weight:normal; font-size:7pt;">S/D ${periodStartDisplay}</span></th>
                <th colspan="3">MUTASI</th>
                <th colspan="2">NILAI<br/><span style="font-weight:normal; font-size:7pt;">S/D ${periodEndDisplay}</span></th>
              </tr>
              <tr>
                <th style="width: 55px;">JUMLAH</th>
                <th style="width: 70px;">RUPIAH</th>
                <th style="width: 50px;">MASUK</th>
                <th style="width: 50px;">KELUAR</th>
                <th style="width: 55px;">JUMLAH</th>
                <th style="width: 55px;">JUMLAH</th>
                <th style="width: 75px;">RUPIAH</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <tr style="font-weight: bold; background-color: #f1f5f9;">
                <td colspan="2" style="text-align: right; border: 1px solid black; padding: 5px;">Jumlah</td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black; text-align: right;">0</td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black; text-align: right;">0</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-section">
            <table>
              <tr>
                <td style="width: 50%;">
                  Disetujui tanggal : ${todayDate}<br/>
                  Kuasa Pengguna Barang
                  <br/><br/><br/><br/>
                  <strong>${namaPj}</strong><br/>
                  NIP. ${nipPj}
                </td>
                <td style="width: 50%; text-align: right;">
                  Palembang, ${todayDate}<br/>
                  Petugas Pengelola Persediaan
                  <br/><br/><br/><br/>
                  <strong>${namaPj}</strong><br/>
                  NIP. ${nipPj}
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Modal for Admin */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                KONFIRMASI PEMBERSIHAN DATA MUTASI
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
                Apakah Anda yakin ingin menghapus <strong className="text-red-600 font-bold">{selectedIds.length} catatan mutasi</strong> yang dipilih?
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>PERHATIAN (ADMIN ONLY):</strong> Tindakan ini akan menghapus catatan riwayat dari database dan melakukan sinkronisasi ke Google Sheets secara permanen. Pastikan Anda sudah mengunduh rekap bulanan sebelum melanjutkan.
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
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus {selectedIds.length} Data Terpilih
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
              placeholder="Cari transaksi, barang, petugas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Jenis Mutasi</option>
            <option value="masuk">Barang Masuk (+)</option>
            <option value="keluar">Barang Keluar (-)</option>
          </select>

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

        {/* Export actions */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak PDF (Kop Resmi)
          </button>
          <button
            onClick={() => setShowOfficialBMNExportModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" /> Cetak Rincian BMN (Resmi)
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" /> Spreadsheet (.csv)
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3.5 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Garis Waktu Mutasi Persediaan BMN</h3>
          </div>

          {isAdmin && filteredRiwayat.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredRiwayat.length && filteredRiwayat.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              Pilih Semua ({filteredRiwayat.length})
            </label>
          )}
        </div>

        <div className="relative border-l-2 border-gray-100 pl-3 sm:pl-4 space-y-4 sm:space-y-6 ml-2 sm:ml-3 py-2">
          {filteredRiwayat.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-6 -ml-3 sm:-ml-4">
              Tidak ada catatan riwayat mutasi ditemukan.
            </div>
          ) : (
            filteredRiwayat.map((r, idx) => (
              <div key={`${r.id}_${idx}`} className="relative flex items-start gap-2">
                {isAdmin && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => handleToggleSelectRow(r.id)}
                    className="mt-2.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0 cursor-pointer"
                  />
                )}
                <div className="relative flex-1">
                  {/* Dot marker */}
                  <span className={`absolute -left-[19px] sm:-left-[25px] top-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white flex items-center justify-center ${
                    r.tipe === 'Masuk' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {r.tipe === 'Masuk' ? <ArrowDownLeft className="w-2 h-2 text-white" /> : <ArrowUpRight className="w-2 h-2 text-white" />}
                  </span>

                  {/* Timeline Content */}
                  <div className={`transition-colors border p-3 sm:p-3.5 rounded-xl text-xs space-y-2 ${
                    selectedIds.includes(r.id) ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 hover:bg-slate-100/60 border-gray-100'
                  }`}>
                    <div className="flex flex-wrap justify-between items-start gap-1.5">
                      <div>
                        <span className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 mr-1.5">
                          {r.id}
                        </span>
                        <span className="font-semibold text-gray-500 text-[11px]">
                          {new Date(r.tanggal).toLocaleDateString('id-ID')} • {new Date(r.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.tipe === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.tipe === 'Masuk' ? 'Masuk' : 'Keluar'} • {r.tipe === 'Masuk' ? '+' : '-'}{r.jumlah}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{r.namaBarang}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[11px] text-gray-500 border-t border-gray-100 pt-2 font-medium">
                      <div>
                        <span className="text-gray-400">Kode Barang: </span>
                        <span className="text-gray-700 font-bold">{r.barangId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Petugas BMN: </span>
                        <span className="text-gray-700 font-bold">{r.petugas}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400">Keterangan: </span>
                        <span className="text-gray-700">{r.keterangan || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export Confirm Modal */}
      <ExportConfirmModal<Riwayat>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Konfirmasi Ekspor Mutasi BMN"
        description="Filter periode bulan atau hari transaksi yang akan dicetak/diunduh"
        dataList={filteredRiwayat}
        getDateFn={item => item.tanggal || ''}
        onConfirm={(filteredData, format, summaryText) => {
          if (format === 'pdf') {
            executePrintPDF(filteredData, summaryText);
          } else {
            executeExportCSV(filteredData, summaryText);
          }
        }}
      />

      {/* Official BMN Report Export Modal */}
      <ExportConfirmModal<Riwayat>
        isOpen={showOfficialBMNExportModal}
        onClose={() => setShowOfficialBMNExportModal(false)}
        title="Cetak Laporan Rincian Barang Persediaan (Resmi BMN)"
        description="Filter periode mutasi transaksi untuk penyusunan Laporan Rincian Barang Persediaan berurutan berdasarkan Master Katalog Barang"
        dataList={filteredRiwayat}
        getDateFn={item => item.tanggal || ''}
        allowedFormats={['pdf']}
        onConfirm={(filteredData, format, summaryText, dateRange) => {
          executePrintOfficialBMNSummaryPDF(filteredData, summaryText, dateRange);
        }}
      />
    </div>
  );
}
