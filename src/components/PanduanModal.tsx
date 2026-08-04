/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb,
  X,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  QrCode,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  Database,
  Printer,
  Camera,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface PanduanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideCategory =
  | 'overview'
  | 'master'
  | 'transaksi'
  | 'qr'
  | 'laporan'
  | 'sync'
  | 'admin';

interface GuideItem {
  id: string;
  category: GuideCategory;
  title: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  steps: string[];
  tips?: string[];
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'ikhtisar-sistem',
    category: 'overview',
    title: 'Alur Kerja & Ikhtisar Sistem',
    icon: Sparkles,
    badge: 'Dasar Utama',
    summary: 'Memahami gambaran umum pengelolaan persediaan BMN dari pendaftaran master data hingga pelaporan akhir.',
    steps: [
      '1. Daftarkan Data Acuan Pendukung (Kategori, Satuan, Supplier, Unit Kerja, Pegawai BMN).',
      '2. Tambahkan Data Master Barang ke dalam katalog dengan batas stok minimal & maksimal.',
      '3. Catat Transaksi Barang Masuk setiap ada pengadaan BMN baru untuk menambah stok.',
      '4. Catat Transaksi Barang Keluar saat terjadi penyerahan/pendistribusian ke unit kerja atau pegawai.',
      '5. Pantau Riwayat Mutasi Stok dan Notifikasi Otomatis jika stok berada di ambang batas kritis.',
      '6. Buat & Cetak Laporan Persediaan BMN berkala (bulanan/tahun berjalan) dalam format PDF atau Excel.'
    ],
    tips: [
      'Stok barang diupdate secara real-time dan tersimpan aman di cloud server.',
      'Setiap perubahan data mencatat histori aktivitas secara otomatis di Audit Log.'
    ]
  },
  {
    id: 'master-barang',
    category: 'master',
    title: 'Kelola Data Master Barang',
    icon: Package,
    badge: 'Katalog BMN',
    summary: 'Langkah lengkap menambah, mengedit, menghapus, mencetak QR Code, serta import data barang.',
    steps: [
      'Buka menu "Data Master" > "Data Barang" di sidebar navigasi.',
      'Klik tombol "Tambah Barang Baru" untuk membuka formulir pendaftaran barang.',
      'Pilih Kategori Barang. Kode ID Barang akan digenerate otomatis secara terstruktur (contoh: 1010301001-000001).',
      'Isi Nama Barang, Satuan, Lokasi Rak/Gudang, Supplier, serta Batas Stok Minimal & Maksimal.',
      'Unggah Foto Barang atau gunakan gambar default untuk identifikasi visual.',
      'Gunakan fitur "Import CSV/Excel" jika ingin memasukkan banyak data barang sekaligus dari spreadsheet.',
      'Gunakan tombol "Cetak QR Code" pada tiap baris barang untuk menempelkan stiker identitas di lokasi rak fisik.'
    ],
    tips: [
      'Batas Stok Minimal akan memicu pemberitahuan peringatan saat persediaan mulai menipis.',
      'Anda bisa memfilter daftar barang berdasarkan kategori atau mencari spesifik via kolom pencarian.'
    ]
  },
  {
    id: 'master-pendukung',
    category: 'master',
    title: 'Kelola Kategori, Supplier, Unit, & Pegawai',
    icon: Layers,
    badge: 'Data Master',
    summary: 'Pengelolaan data referensi untuk mempermudah klasifikasi dan pencatatan penanggung jawab.',
    steps: [
      'Menu Kategori: Menentukan kelompok BMN (seperti Alat Tulis Kantor, Bahan Komputer, Alat Kebersihan, dll).',
      'Menu Supplier: Menyimpan daftar distributor / rekanan penyedia BMN beserta kontak person.',
      'Menu Unit Kerja: Menyiapkan daftar sub-bagian / unit penerima barang di lingkungan BPMP Sumsel.',
      'Menu Satuan: Mengatur opsi satuan barang (Buah, Rim, Dus, Pak, Set, Roll, dll).',
      'Menu Pegawai BMN: Mencatat data pengelola/pimpinan BMN beserta NIP dan Jabatan resmi.'
    ],
    tips: [
      'Pastikan memasukkan Kode Kategori BMN standar agar pengelompokan barang berjalan presisi.'
    ]
  },
  {
    id: 'transaksi-masuk',
    category: 'transaksi',
    title: 'Transaksi Barang Masuk (Penerimaan)',
    icon: ArrowDownLeft,
    badge: 'Stok Masuk',
    summary: 'Pencatatan penerimaan BMN baru hasil pengadaan atau hibah untuk menambah saldo stok.',
    steps: [
      'Buka menu "Barang Masuk" dari navigasi samping.',
      'Klik tombol "Tambah Barang Masuk".',
      'Pilih barang yang diterima dari dropdown atau gunakan Pemindai Kamera QR Code untuk scan barcode barang.',
      'Isi Jumlah Masuk, Tanggal Penerimaan, Sumber/Supplier, Nomor Dokumen/BAST, dan Catatan.',
      'Unggah foto/file bukti fisik dokumen penerimaan (BAST/Faktur) jika ada.',
      'Klik "Simpan Transaksi". Stok barang terkait di katalog akan bertambah secara otomatis.',
      'Cetak Bukti Transaksi Masuk sebagai lampiran arsip BMN.'
    ],
    tips: [
      'Gunakan tombol QR Scanner pada modal untuk mempercepat pemilihan barang tanpa mengetik.'
    ]
  },
  {
    id: 'transaksi-keluar',
    category: 'transaksi',
    title: 'Transaksi Barang Keluar (Pengeluaran)',
    icon: ArrowUpRight,
    badge: 'Stok Keluar',
    summary: 'Pencatatan pengeluaran BMN untuk pemakaian unit kerja atau pegawai terdaftar.',
    steps: [
      'Buka menu "Barang Keluar" di sidebar.',
      'Klik "Tambah Barang Keluar".',
      'Pilih Barang yang akan dikeluarkan (atau scan QR Code pada fisik barang).',
      'Sistem akan menampilkan jumlah stok tersedia saat ini secara otomatis.',
      'Isi Jumlah Keluar, Unit Kerja Penerima, Pegawai Penerima, Tanggal Pengeluaran, serta Keperluan/Keterangan.',
      'Sistem akan memvalidasi agar jumlah yang dikeluarkan tidak melebihi stok yang tersedia.',
      'Klik "Simpan Transaksi" untuk memotong stok barang dan menyimpan nota bukti pengeluaran.'
    ],
    tips: [
      'Jika stok tidak mencukupi, sistem akan menolak transaksi dan memberikan peringatan.'
    ]
  },
  {
    id: 'qr-scanner',
    category: 'qr',
    title: 'Penggunaan QR Code & Kamera Scanner',
    icon: QrCode,
    badge: 'Pemindaian',
    summary: 'Cara memanfaatkan QR Code fisik barang untuk percepatan inventarisasi dan pencarian.',
    steps: [
      'Setiap data barang memiliki kode unik yang dipetakan ke QR Code.',
      'Di menu Data Barang, klik ikon QR Code pada baris barang untuk melihat & mencetak QR Code.',
      'Tempelkan cetakan QR Code pada kemasan atau lokasi rak simpan fisik.',
      'Saat input Barang Masuk / Keluar, klik tombol "Scan QR Code" berikon kamera.',
      'Berikan izin kamera browser, lalu arahkan kamera ke kode QR barang.',
      'Sistem akan otomatis mengenali barang dan mengisikan data item ke formulir transaksi.'
    ],
    tips: [
      'Pastikan kamera perangkat Anda memiliki pencahayaan memadai agar proses scan berlangsung cepat.'
    ]
  },
  {
    id: 'laporan-analytics',
    category: 'laporan',
    title: 'Laporan & Analytics Persediaan',
    icon: FileText,
    badge: 'Pelaporan',
    summary: 'Membuat laporan rekapitulasi persediaan BMN, posisi stok, serta mutasi bulanan.',
    steps: [
      'Buka menu "Laporan & Analytics".',
      'Pilih Jenis Laporan: Laporan Persediaan Barang, Laporan Mutasi Stok, atau Laporan Stok Kritis.',
      'Atur Filter Periode Tanggal dan Kategori jika diperlukan.',
      'Periksa ringkasan grafik statistik dan tabel rincian item.',
      'Klik "Cetak Laporan PDF" untuk mencetak dokumen siap pakai lengkap dengan kops instansi.',
      'Klik "Export Excel / CSV" untuk mengunduh berkas spreadsheet mentah.'
    ],
    tips: [
      'Laporan disesuaikan dengan format kearsipan BMN Kementerian / Lembaga.'
    ]
  },
  {
    id: 'sync-sheets',
    category: 'sync',
    title: 'Integrasi Google Sheets & Backup Data',
    icon: FileSpreadsheet,
    badge: 'Penyimpanan',
    summary: 'Penyimpanan otomatis ke cloud database dan penyelarasan ke Google Sheets.',
    steps: [
      'Sistem dilengkapi autosave pintar yang langsung menyimpan perubahan ke cloud server.',
      'Indikator status "Menyimpan data..." di bagian atas layar menunjukkan aktivitas penyelarasan.',
      'Untuk menghubungkan dengan Google Sheets instansi, buka menu "Pengaturan Sistem" > "Google Workspace Integrasi".',
      'Masukkan URL Spreadsheet ID atau Apps Script Deployment ID yang dikonfigurasi.',
      'Klik "Tes Koneksi / Sinkronisasi Manual" untuk memastikan koneksi aktif.'
    ],
    tips: [
      'Anda juga dapat mengunduh cadangan lokal (Backup JSON) di Pengaturan Sistem kapan saja.'
    ]
  },
  {
    id: 'admin-keamanan',
    category: 'admin',
    title: 'Hak Akses, Otentikasi & Audit Log',
    icon: ShieldCheck,
    badge: 'Keamanan',
    summary: 'Memahami pembagian hak akses peran (Role) dan verifikasi keamanan pengguna.',
    steps: [
      'Role Administrator (admin): Akses penuh ke seluruh menu, termasuk Admin Control Center untuk menyetujui akun baru, reset password, dan kelola otorisasi.',
      'Role Petugas BMN: Mengelola data master, pencatatan transaksi masuk/keluar, dan laporan harian.',
      'Persetujuan Registrasi: Pengguna baru yang mendaftar harus disetujui terlebih dahulu oleh Admin di menu Admin Control Center.',
      'Audit Log: Semua aktivitas penting (tambah, edit, hapus, kelola akun, sync) dicatat transparan di menu Audit Log.'
    ],
    tips: [
      'Gunakan tombol "Keluar" di header saat selesai menggunakan sistem untuk mengamankan sesi.'
    ]
  }
];

export default function PanduanModal({ isOpen, onClose }: PanduanModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | 'all'>('all');
  const [activeGuideId, setActiveGuideId] = useState<string>('ikhtisar-sistem');

  if (!isOpen) return null;

  const categories: { id: GuideCategory | 'all'; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Semua Panduan', icon: HelpCircle },
    { id: 'overview', label: 'Alur Sistem', icon: Sparkles },
    { id: 'master', label: 'Data Master', icon: Package },
    { id: 'transaksi', label: 'Transaksi Stok', icon: ArrowDownLeft },
    { id: 'qr', label: 'QR Scanner', icon: QrCode },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'sync', label: 'Cloud & Sheets', icon: FileSpreadsheet },
    { id: 'admin', label: 'Keamanan & User', icon: ShieldCheck }
  ];

  const filteredGuides = GUIDE_ITEMS.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const activeGuide = GUIDE_ITEMS.find(item => item.id === activeGuideId) || GUIDE_ITEMS[0];

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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-2 sm:inset-6 md:inset-10 lg:inset-x-20 lg:inset-y-12 bg-white rounded-3xl shadow-2xl z-[100] overflow-hidden flex flex-col border border-slate-200/80 max-w-6xl mx-auto"
          >
            {/* Header Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between gap-4 flex-shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Lightbulb className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      Panduan Penggunaan Aplikasi
                    </h2>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                      Resmi BPMP Sumsel
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 font-medium hidden sm:block">
                    Petunjuk operasional lengkap penggunaan fitur Sistem Persediaan BMN BPMP Provinsi Sumatera Selatan
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex-shrink-0 hover:rotate-90 duration-200"
                title="Tutup Panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        // Select first matching guide if available
                        const first = GUIDE_ITEMS.find(
                          i => cat.id === 'all' || i.category === cat.id
                        );
                        if (first) setActiveGuideId(first.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari petunjuk atau fitur..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Modal Body (Sidebar List + Detail View) */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: List of Guides */}
              <div className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 bg-slate-50/50 overflow-y-auto p-3 space-y-2 flex-shrink-0 max-h-[35vh] md:max-h-none">
                {filteredGuides.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Panduan tidak ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba kata kunci lain atau pilih kategori Semua Panduan.
                    </p>
                  </div>
                ) : (
                  filteredGuides.map(guide => {
                    const Icon = guide.icon;
                    const isSelected = activeGuideId === guide.id;
                    return (
                      <div
                        key={guide.id}
                        onClick={() => setActiveGuideId(guide.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-300/80 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-amber-900' : 'text-slate-800'
                              }`}
                            >
                              {guide.title}
                            </h4>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase ${
                                isSelected
                                  ? 'bg-amber-200/80 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {guide.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {guide.summary}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Detailed Steps View */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-white space-y-6">
                {activeGuide ? (
                  <div>
                    {/* Header Item */}
                    <div className="pb-5 border-b border-slate-200 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-lg uppercase tracking-wider">
                            {activeGuide.badge}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            Modul BMN
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                          <activeGuide.icon className="w-6 h-6 text-amber-600" />
                          {activeGuide.title}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed font-medium">
                          {activeGuide.summary}
                        </p>
                      </div>
                    </div>

                    {/* Steps Container */}
                    <div className="mt-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Langkah Operasional
                      </h4>

                      <div className="space-y-3">
                        {activeGuide.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-start gap-3.5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                              {idx + 1}
                            </div>
                            <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                              {step.replace(/^\d+\.\s*/, '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips Box */}
                    {activeGuide.tips && activeGuide.tips.length > 0 && (
                      <div className="mt-6 p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>Tips & Catatan Penting</span>
                        </div>
                        <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-900 font-medium leading-relaxed">
                          {activeGuide.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Support Footer Box */}
                    <div className="mt-8 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Butuh bantuan lebih lanjut?
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Hubungi Subbagian Umum / Petugas BMN BPMP Sumatera Selatan.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Paham, Tutup Panduan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Pilih modul di sebelah kiri untuk membaca panduan detail.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between gap-2 flex-shrink-0 font-medium">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Sistem Persediaan BMN v2.5 — BPMP Provinsi Sumatera Selatan</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">Tekan ESC atau tombol silang untuk menutup</span>
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
