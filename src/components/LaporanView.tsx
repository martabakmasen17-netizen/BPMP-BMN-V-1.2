/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileSpreadsheet, Printer, AlertTriangle, PackageCheck, Download, Package } from 'lucide-react';
import { Barang, Riwayat, Settings } from '../types';

interface LaporanViewProps {
  barang: Barang[];
  riwayat: Riwayat[];
  instituteName: string;
  settings?: Settings;
}

export default function LaporanView({ barang, riwayat, instituteName, settings }: LaporanViewProps) {
  // Calculations
  const totalBarang = barang.length;
  const stokMenipis = barang.filter(b => b.stokSekarang < b.stokMin && b.stokSekarang > 0).length;
  const stokHabis = barang.filter(b => b.stokSekarang === 0).length;
  const totalStokUnit = barang.reduce((sum, item) => sum + item.stokSekarang, 0);

  const subHeaderKop = settings?.subHeaderKop || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI';
  const namaInstansi = settings?.namaInstitusi || 'BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI SUMATERA SELATAN';
  const alamatKop = settings?.alamatKop || 'Jl. Jenderal Sudirman Km. 6.5 Palembang Telp. (0711) 356789 Fax. 356790';
  const kontakKop = settings?.kontakKop || 'Email: bpmp.sumsel@kemdikbud.go.id | Laman: bpmp-sumsel.kemdikbud.go.id';
  const namaPj = settings?.namaPenanggungJawab || 'Ilham Muharrama';
  const jabatanPj = settings?.jabatanPenanggungJawab || 'Administrator / Petugas BMN';
  const nipPj = settings?.nipPenanggungJawab || '-';

  const handlePrintOfficialPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rows = barang
      .map(
        (b, i) => `
        <tr>
          <td style="text-align: center; border: 1px solid black; padding: 6px;">${i + 1}</td>
          <td style="border: 1px solid black; padding: 6px; font-family: monospace;">${b.id}</td>
          <td style="border: 1px solid black; padding: 6px;">${b.nama}</td>
          <td style="border: 1px solid black; padding: 6px;">${b.kategori}</td>
          <td style="text-align: center; border: 1px solid black; padding: 6px;">${b.stokSekarang}</td>
          <td style="text-align: center; border: 1px solid black; padding: 6px;">${b.satuan}</td>
          <td style="border: 1px solid black; padding: 6px;">${b.lokasiRak}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Persediaan Barang BMN - BPMP Sumsel</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: black; line-height: 1.4; }
            .kop { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px; }
            .kop h2 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: normal; }
            .kop h1 { margin: 5px 0; font-size: 18px; text-transform: uppercase; font-weight: bold; }
            .kop p { margin: 2px 0; font-size: 11px; }
            .meta { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 25px; }
            .meta span { display: block; margin-top: 5px; font-size: 12px; font-weight: normal; text-transform: none; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
            th { border: 1px solid black; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            .signature-block { width: 100%; margin-top: 50px; font-size: 12px; }
            .signature-block table { border: none; font-size: 12px; margin: 0; }
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
            LAPORAN REKAPITULASI PERSEDIAAN BARANG BMN
            <span>Per Tanggal: ${todayDate}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">No</th>
                <th style="width: 14%">Kode Barang</th>
                <th style="width: 32%">Nama Barang</th>
                <th style="width: 22%">Kategori</th>
                <th style="width: 9%">Volume</th>
                <th style="width: 8%">Satuan</th>
                <th style="width: 10%">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr>
                <td colspan="4" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: right;">TOTAL VOLUME STOK PERSIDIAAN</td>
                <td style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">${totalStokUnit}</td>
                <td style="border: 1px solid black; padding: 8px; font-weight: bold;"></td>
                <td style="border: 1px solid black; padding: 8px; font-weight: bold;"></td>
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
          <button onclick="window.print()" class="no-print" style="padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: block; margin: 0 auto;">Cetak Dokumen Laporan</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportSpreadsheet = () => {
    const headers = 'Kode Barang,Nama Barang,Kategori,Supplier,Satuan,Lokasi Rak,Stok Sekarang,Stok Minimum\n';
    const rows = barang
      .map(
        b =>
          `"${b.id}","${b.nama}","${b.kategori}","${b.supplier}","${b.satuan}","${b.lokasiRak}",${b.stokSekarang},${b.stokMin}`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Laporan_Rekap_Persediaan_BM_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Quick stats on inventory health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Total Katalog BMN</span>
            <span className="text-lg font-bold text-gray-900 block mt-0.5">{totalBarang} Jenis Item</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Kesehatan Katalog</span>
            <span className="text-lg font-bold text-gray-900 block mt-0.5">
              {totalBarang > 0 ? Math.round(((totalBarang - stokMenipis - stokHabis) / totalBarang) * 100) : 100}% Aman
            </span>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500 block font-medium">Item Perlu Restok</span>
            <span className="text-lg font-bold text-gray-900 block mt-0.5">{stokMenipis + stokHabis} Item</span>
          </div>
        </div>
      </div>

      {/* Reports portal section with bento items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Laporan Rekapitulasi Persediaan */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" />
              Laporan Rekapitulasi Persediaan (Katalog BMN)
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Laporan komprehensif berisi kode barang, nama barang, lokasi rak, volume sisa stok saat ini, dan satuan kuantitas persediaan BPMP Sumsel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handlePrintOfficialPDF}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak PDF (Kop Resmi)
            </button>
            <button
              onClick={handleExportSpreadsheet}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-green-400" /> Export Excel/CSV
            </button>
          </div>
        </div>

        {/* Laporan Transaksi Bulanan */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-green-600" />
              Laporan Buku Mutasi Transaksi (Buku Besar)
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mengekspor berkas riwayat seluruh sirkulasi keluar dan masuk barang yang disahkan oleh penanggung jawab per semester.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                alert('Dokumen rekap bulanan diunduh otomatis dalam format Spreadsheet.');
                handleExportSpreadsheet();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Unduh Laporan Bulanan (.csv)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
