/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Barang {
  id: string; // Kode Barang (e.g. 000001, 000002) per kategori
  kategoriId: string; // Kode Kategori (e.g. 1010301001)
  kategori: string; // Nama Kategori
  nama: string;
  supplier: string;
  satuan: string;
  stokSekarang: number;
  stokMin: number;
  stokMaks: number;
  deskripsi: string;
  imageUrl: string;
  lokasiRak?: string;
  lokasi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Kategori {
  id: string; // Kode Kategori (e.g. 1010301001)
  nama: string;
  deskripsi: string;
  qrCodeUrl?: string; // Barcode / QR Code for category
}

export interface Supplier {
  id: string;
  nama: string;
  kontak: string;
  telepon: string;
  alamat: string;
}

export interface Unit {
  id: string;
  nama: string;
  penanggungJawab: string;
  keterangan: string;
}

export type TipeSatuan = 'kemasan' | 'tunggal' | 'lembaran' | 'panjang' | 'volume' | 'lainnya';

export interface Satuan {
  id: string;
  nama: string;
  keterangan: string;
  tipe?: TipeSatuan;
  faktorKonversi?: number; // Faktor pengali ke satuan terkecil/dasar (misal 1 Lusin = 12 Buah, 1 Rim = 500 Lembar, 1 Kotak = 10 Buah)
  satuanDasar?: string; // Satuan dasar ekuivalen (misal: "Buah", "Lembar", "Meter", "Botol", "Tube", "Unit")
  rekomendasiStokMin?: number; // Rekomendasi batas minimum stok yang proporsional untuk satuan ini (misal Lusin: 1-2, Rim: 2, Buah: 10)
  rekomendasiStokMaks?: number; // Rekomendasi batas maksimum stok
}

export interface BarangMasuk {
  id: string;
  tanggal: string;
  barangId: string;
  namaBarang: string;
  jumlah: number;
  supplier: string;
  petugas: string;
  fileDokumen: string; // Filename or Drive URL
  fileData?: string; // Base64 or Object URL of uploaded document
  catatan: string;
  isSusulan?: boolean; // Penanda apakah transaksi ini merupakan data susulan/backdated
  keteranganSusulan?: string; // Alasan/keterangan pencatatan susulan
  waktuInputSistem?: string; // Timestamp saat admin menginput ke sistem
}

export interface BarangKeluar {
  id: string;
  tanggal: string;
  barangId: string;
  namaBarang: string;
  jumlah: number;
  unitId: string;
  petugas: string;
  keperluan: string;
  statusPersetujuan: 'Pending' | 'Disetujui' | 'Ditolak';
  fileDokumen?: string;
  fileData?: string;
  driveLink?: string;
  catatan: string;
  isSusulan?: boolean; // Penanda apakah transaksi ini merupakan data susulan/backdated
  keteranganSusulan?: string; // Alasan/keterangan pencatatan susulan
  waktuInputSistem?: string; // Timestamp saat admin menginput ke sistem
}

export interface DriveFileItem {
  id: string;
  name: string;
  folder: 'Reports' | 'Images' | 'QRCode' | 'Backup' | 'Dokumen';
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl?: string;
  webViewLink?: string;
  fileId?: string;
  status?: 'Tersinkron ke Google Drive' | 'Tersimpan di Cloud Storage';
}

export interface Riwayat {
  id: string;
  tanggal: string;
  tipe: 'Masuk' | 'Keluar';
  barangId: string;
  namaBarang: string;
  jumlah: number;
  petugas: string;
  keterangan: string;
}

export interface AuditLog {
  id: string;
  tanggal: string;
  aktor: string;
  role: string;
  aksi: string;
  detail: string;
}

export interface NotificationDetail {
  namaBarang?: string;
  jumlah?: number;
  satuan?: string;
  unitAtauSupplier?: string;
  petugas?: string;
  catatan?: string;
  tipeTransaksi?: 'Masuk' | 'Keluar' | 'Persetujuan' | 'Stok Alert' | 'Sistem' | 'Registrasi' | 'Aktivitas';
  status?: string;
  keperluan?: string;
  barangId?: string;
  noDokumen?: string;
}

export interface SystemNotification {
  id: string;
  tipe: 'stok_rendah' | 'stok_habis' | 'sistem' | 'barang_masuk' | 'barang_keluar' | 'registrasi_user' | 'aktivitas';
  pesan: string;
  tanggal: string;
  read: boolean;
  readByUsers?: string;
  barangId?: string;
  transaksiId?: string;
  actorName?: string;
  actorRole?: 'Administrator' | 'Petugas BMN';
  isAdminOnly?: boolean;
  details?: NotificationDetail;
}

export interface Settings {
  namaInstitusi: string;
  subHeaderKop?: string;
  alamatKop?: string;
  kontakKop?: string;
  namaPenanggungJawab?: string;
  jabatanPenanggungJawab?: string;
  nipPenanggungJawab?: string;
  logoUrl: string;
  prefiksKodeBarang?: string;
  defaultStokMin?: number;
  autoSyncIntervalSec?: number;
  folderQrId: string;
  folderImagesId: string;
  folderReportsId?: string; // Legacy
  folderLaporanId?: string;
  folderDokumenId?: string;
  folderBackupId: string;
  spreadsheetId: string;
  serviceAccountEmail?: string;
  serviceAccountPrivateKey?: string;
  bilaStokRendahNotif: boolean;
  bilaStokHabisNotif: boolean;
  konfirmasiOtomatisKeluar?: boolean;
  uapb?: string;
  uappbE1?: string;
  uappbW?: string;
  kodeUakpb?: string;
}

export interface Pegawai {
  id: string;
  nama: string;
  jabatan: string; // Kolom Kiri: Jabatan Struktural / Fungsional
  tugas?: string; // Kolom Kanan: Tugas dan Tanggung Jawab (PJ BMN, Anggota, atau bebas diisi untuk Magang/KP)
  nip?: string;
  telepon?: string;
  unitKerja?: string;
}

export interface UserAccount {
  username: string;
  nama: string;
  nip: string;
  jabatan: string; // Kolom Kiri: Jabatan
  tugas?: string; // Kolom Kanan: Tugas dan Tanggung Jawab
  telepon: string;
  password?: string;
  role: 'Administrator' | 'Petugas BMN';
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  registeredAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'barang'
  | 'kategori'
  | 'supplier'
  | 'unit'
  | 'satuan'
  | 'pegawai'
  | 'barang_masuk'
  | 'barang_keluar'
  | 'riwayat'
  | 'laporan'
  | 'pengaturan'
  | 'audit_log'
  | 'admin_control';
