/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kategori, Supplier, Unit, Satuan, Barang, BarangMasuk, BarangKeluar, Riwayat, AuditLog, SystemNotification, Settings, Pegawai, DriveFileItem } from './types';
import { STANDARD_SATUAN_PRESETS } from './utils/unitUtils';

export const INITIAL_KATEGORI: Kategori[] = [];

export const INITIAL_SUPPLIER: Supplier[] = [];

export const INITIAL_UNIT: Unit[] = [];

export const INITIAL_SATUAN: Satuan[] = STANDARD_SATUAN_PRESETS.map((p, idx) => ({
  id: `SAT-${String(idx + 1).padStart(3, '0')}`,
  nama: p.nama,
  keterangan: p.keterangan,
  tipe: p.tipe,
  faktorKonversi: p.faktorKonversi,
  satuanDasar: p.satuanDasar,
  rekomendasiStokMin: p.rekomendasiStokMin,
  rekomendasiStokMaks: p.rekomendasiStokMaks,
}));

export const INITIAL_BARANG: Barang[] = [];

export const INITIAL_BARANG_MASUK: BarangMasuk[] = [];

export const INITIAL_BARANG_KELUAR: BarangKeluar[] = [];

export const INITIAL_RIWAYAT: Riwayat[] = [];

export const INITIAL_AUDIT_LOG: AuditLog[] = [];

export const INITIAL_NOTIFICATION: SystemNotification[] = [];

export const DEFAULT_SETTINGS: Settings = {
  namaInstitusi: 'BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI SUMATERA SELATAN',
  subHeaderKop: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
  alamatKop: 'Jl. Jenderal Sudirman Km. 6.5 Palembang Telp. (0711) 356789 Fax. 356790',
  kontakKop: 'Email: bpmp.sumsel@kemdikbud.go.id | Laman: bpmp-sumsel.kemdikbud.go.id',
  namaPenanggungJawab: 'Ilham Muharrama',
  jabatanPenanggungJawab: 'Magang/KP / Petugas BMN',
  nipPenanggungJawab: '-',
  logoUrl: '/logo.png',
  prefiksKodeBarang: 'BRG-',
  defaultStokMin: 5,
  autoSyncIntervalSec: 2,
  folderQrId: '1dr_qr_code_bpmp_sumsel_folder',
  folderImagesId: '1dr_images_bpmp_sumsel_folder',
  folderReportsId: '1dr_reports_bpmp_sumsel_folder',
  folderBackupId: '1dr_backup_bpmp_sumsel_folder',
  spreadsheetId: '1ss_bpmp_sumsel_inventory_database',
  bilaStokRendahNotif: true,
  bilaStokHabisNotif: true,
  konfirmasiOtomatisKeluar: true
};

export const INITIAL_PEGAWAI: Pegawai[] = [
  { id: 'PGW-001', nama: 'Roni Setiawan', jabatan: 'Petugas BMN', nip: '198804152014021003', telepon: '0812-7123-4567' },
  { id: 'PGW-002', nama: 'Ilham Muharrama', jabatan: 'Magang/KP', nip: '-', telepon: '08981741680' },
  { id: 'PGW-003', nama: 'Budi Hermawan', jabatan: 'Staf BMN', nip: '199112022019031005', telepon: '0821-8899-7711' },
  { id: 'PGW-004', nama: 'Drs. H. Sunardi, M.Pd.', jabatan: 'Pimpinan / Kepala BPMP', nip: '196703081992031003', telepon: '0812-7345-9988' },
  { id: 'PGW-005', nama: 'Siti Aminah, S.E.', jabatan: 'Staf Administrasi BMN', nip: '199305142020012003', telepon: '0813-6677-8899' },
  { id: 'PGW-006', nama: 'Heri Prasetyo', jabatan: 'Staf Inventarisasi BMN', nip: '198911102016031001', telepon: '0812-5544-3322' }
];

export const INITIAL_DRIVE_FILES: DriveFileItem[] = [];
